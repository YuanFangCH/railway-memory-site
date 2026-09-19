#!/bin/sh
set -eu

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${GUIDE_AGENT_READONLY_DB_USER:?GUIDE_AGENT_READONLY_DB_USER is required}"
: "${GUIDE_AGENT_READONLY_DB_PASSWORD:?GUIDE_AGENT_READONLY_DB_PASSWORD is required}"

PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  --set ON_ERROR_STOP=1 \
  --set agent_user="${GUIDE_AGENT_READONLY_DB_USER}" \
  --set agent_password="${GUIDE_AGENT_READONLY_DB_PASSWORD}" \
  --set database_name="${POSTGRES_DB}" \
  --host postgres \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN', :'agent_user')
WHERE NOT EXISTS (
  SELECT 1 FROM pg_roles WHERE rolname = :'agent_user'
)\gexec

ALTER ROLE :"agent_user"
  WITH LOGIN
       PASSWORD :'agent_password'
       NOCREATEDB
       NOCREATEROLE
       NOREPLICATION
       NOBYPASSRLS;

GRANT CONNECT ON DATABASE :"database_name" TO :"agent_user";
GRANT USAGE ON SCHEMA public TO :"agent_user";

SELECT format('REVOKE ALL PRIVILEGES ON TABLE %I FROM %I', table_name, :'agent_user')
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = ANY(ARRAY[
    'Category',
    'Tag',
    'Post',
    'Video',
    'Image',
    'MediaAsset',
    'SiteSetting',
    '_PostToTag',
    '_TagToVideo',
    'User',
    '_prisma_migrations',
    'AgentWriteSession',
    'AgentWriteAudit'
  ])\gexec

SELECT format('GRANT SELECT ON TABLE %I TO %I', table_name, :'agent_user')
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = ANY(ARRAY[
    'Category',
    'Tag',
    'Post',
    'Video',
    'Image',
    'MediaAsset',
    'SiteSetting',
    '_PostToTag',
    '_TagToVideo'
  ])\gexec
SQL
