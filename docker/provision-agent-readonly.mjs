import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const user = process.env.GUIDE_AGENT_READONLY_DB_USER?.trim();
const password = process.env.GUIDE_AGENT_READONLY_DB_PASSWORD?.trim();
const database = process.env.POSTGRES_DB?.trim() || "railway";

if (!user || !password) {
  console.log("Agent read-only database role is not configured; skipping.");
  process.exit(0);
}

function identifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function literal(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const readableTables = [
  "Category",
  "Tag",
  "Post",
  "Video",
  "Image",
  "MediaAsset",
  "SiteSetting",
  "_PostToTag",
  "_TagToVideo"
];

const blockedTables = [
  "User",
  "_prisma_migrations",
  "AgentWriteSession",
  "AgentWriteAudit"
];

const role = identifier(user);

await prisma.$executeRawUnsafe(`
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${literal(user)}) THEN
      CREATE ROLE ${role} LOGIN;
    END IF;
  END
  $$;
`);
await prisma.$executeRawUnsafe(`
  ALTER ROLE ${role}
    WITH LOGIN
         PASSWORD ${literal(password)}
         NOCREATEDB
         NOCREATEROLE
         NOREPLICATION
         NOBYPASSRLS
`);
await prisma.$executeRawUnsafe(
  `GRANT CONNECT ON DATABASE ${identifier(database)} TO ${role}`
);
await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${role}`);

for (const table of [...readableTables, ...blockedTables]) {
  const exists = await prisma.$queryRawUnsafe(
    "SELECT to_regclass($1)::text AS name",
    `public.${table}`
  );
  if (!exists[0]?.name) {
    continue;
  }
  await prisma.$executeRawUnsafe(
    `REVOKE ALL PRIVILEGES ON TABLE ${identifier(table)} FROM ${role}`
  );
}

for (const table of readableTables) {
  const exists = await prisma.$queryRawUnsafe(
    "SELECT to_regclass($1)::text AS name",
    `public.${table}`
  );
  if (!exists[0]?.name) {
    continue;
  }
  await prisma.$executeRawUnsafe(
    `GRANT SELECT ON TABLE ${identifier(table)} TO ${role}`
  );
}

console.log(`Agent read-only role ${user} provisioned.`);
await prisma.$disconnect();
