#!/usr/bin/env sh
set -eu

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-./backups/$STAMP}"

mkdir -p "$BACKUP_DIR"

if command -v docker >/dev/null 2>&1; then
  PROJECT_NAME="${COMPOSE_PROJECT_NAME:-$(basename "$(pwd)")}"

  echo "Backing up PostgreSQL..."
  docker compose exec -T postgres pg_dump -U "${POSTGRES_USER:-blog}" "${POSTGRES_DB:-blog}" > "$BACKUP_DIR/database.sql"

  echo "Backing up MinIO objects..."
  mkdir -p "$BACKUP_DIR/minio"
  docker run --rm \
    -v "${PROJECT_NAME}_minio_data:/source:ro" \
    -v "$(pwd)/$BACKUP_DIR/minio:/backup" \
    alpine sh -c "cp -a /source/. /backup/"

  echo "Backup written to $BACKUP_DIR"
else
  echo "Docker is not available. Create the volume backups manually."
  exit 1
fi
