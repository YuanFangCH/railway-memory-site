CREATE TABLE "AgentWriteSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'draft-only',
    "purpose" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AgentWriteSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentWriteAudit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "request" JSONB NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentWriteAudit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentWriteSession_tokenHash_key"
    ON "AgentWriteSession"("tokenHash");

CREATE INDEX "AgentWriteSession_expiresAt_idx"
    ON "AgentWriteSession"("expiresAt");

CREATE INDEX "AgentWriteAudit_sessionId_createdAt_idx"
    ON "AgentWriteAudit"("sessionId", "createdAt");

CREATE INDEX "AgentWriteAudit_createdAt_idx"
    ON "AgentWriteAudit"("createdAt");

ALTER TABLE "AgentWriteAudit"
    ADD CONSTRAINT "AgentWriteAudit_sessionId_fkey"
    FOREIGN KEY ("sessionId")
    REFERENCES "AgentWriteSession"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
