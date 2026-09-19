import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { prisma } from "@/lib/db";

export const AGENT_WRITE_SCOPES = [
  "posts:write",
  "images:write",
  "videos:write",
  "media:write"
] as const;

export const AGENT_PUBLISH_SCOPES = [
  "posts:publish",
  "images:publish",
  "videos:publish"
] as const;

export const AGENT_WRITE_MODES = [
  "draft-only",
  "draft-and-publish"
] as const;

export type AgentWriteMode = (typeof AGENT_WRITE_MODES)[number];

export class AgentWriteError extends Error {
  constructor(
    message: string,
    readonly status = 400
  ) {
    super(message);
    this.name = "AgentWriteError";
  }
}

export const sessionCreateSchema = z.object({
  minutes: z.number().int().min(5).max(60).default(30),
  mode: z.enum(AGENT_WRITE_MODES).default("draft-only"),
  purpose: z.string().trim().min(3).max(200),
  createdBy: z.string().trim().min(1).max(100).default("agent")
}).superRefine((value, context) => {
  if (value.mode === "draft-and-publish" && value.minutes !== 30) {
    context.addIssue({
      code: "custom",
      path: ["minutes"],
      message: "publish_sessions_are_30_minutes"
    });
  }
});

export function configuredAgentWriteAdminToken() {
  return process.env.GUIDE_AGENT_WRITE_ADMIN_TOKEN?.trim() || "";
}

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function isAgentWriteAdminAuthorized(request: Request) {
  const expected = configuredAgentWriteAdminToken();
  const actual = bearerToken(request);
  return Boolean(expected && actual && secureEqual(expected, actual));
}

export function hashAgentWriteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateAgentWriteToken() {
  return `aw_live_${randomBytes(32).toString("base64url")}`;
}

export async function createAgentWriteSession(input: {
  minutes: number;
  mode: AgentWriteMode;
  purpose: string;
  createdBy: string;
}) {
  const token = generateAgentWriteToken();
  const minutes = input.mode === "draft-and-publish" ? 30 : input.minutes;
  const expiresAt = new Date(Date.now() + minutes * 60_000);
  const scopes = [
    ...AGENT_WRITE_SCOPES,
    ...(input.mode === "draft-and-publish" ? AGENT_PUBLISH_SCOPES : [])
  ];
  const session = await prisma.agentWriteSession.create({
    data: {
      tokenHash: hashAgentWriteToken(token),
      scopes,
      mode: input.mode,
      purpose: input.purpose,
      createdBy: input.createdBy,
      expiresAt
    }
  });
  return { session: publicSession(session), token };
}

export function publicSession(session: {
  id: string;
  scopes: string[];
  mode: string;
  purpose: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: session.id,
    scopes: session.scopes,
    mode: session.mode,
    purpose: session.purpose,
    createdBy: session.createdBy,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    revokedAt: session.revokedAt?.toISOString() || null,
    active: !session.revokedAt && session.expiresAt.getTime() > Date.now()
  };
}

export async function listAgentWriteSessions() {
  const sessions = await prisma.agentWriteSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return sessions.map(publicSession);
}

export async function revokeAgentWriteSession(id: string) {
  const session = await prisma.agentWriteSession.update({
    where: { id },
    data: { revokedAt: new Date() }
  });
  return publicSession(session);
}

export async function requireAgentWriteSession(request: Request) {
  const token = bearerToken(request);
  if (!token) {
    throw new AgentWriteError("write_session_required", 401);
  }
  const session = await prisma.agentWriteSession.findUnique({
    where: { tokenHash: hashAgentWriteToken(token) }
  });
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new AgentWriteError("write_session_expired", 401);
  }
  const missingWriteScope = AGENT_WRITE_SCOPES.some(
    (scope) => !session.scopes.includes(scope)
  );
  if (missingWriteScope) {
    throw new AgentWriteError("write_scope_missing", 403);
  }
  return session;
}

export function sessionCanPublish(session: { scopes: string[] }) {
  return AGENT_PUBLISH_SCOPES.every((scope) =>
    session.scopes.includes(scope)
  );
}

export async function recordAgentWriteAudit(input: {
  sessionId: string;
  action: string;
  contentType: string;
  contentId?: string | null;
  success: boolean;
  error?: string | null;
  request: unknown;
  result?: unknown;
}) {
  await prisma.agentWriteAudit.create({
    data: {
      sessionId: input.sessionId,
      action: input.action,
      contentType: input.contentType,
      contentId: input.contentId || null,
      success: input.success,
      error: input.error?.slice(0, 4000) || null,
      request: input.request as never,
      result: (input.result || undefined) as never
    }
  });
}

export function agentWriteErrorResponse(error: unknown) {
  if (error instanceof AgentWriteError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "write_failed";
  return Response.json({ error: message }, { status: 500 });
}

export function summarizeAgentWriteRequest(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valueType: typeof value };
  }
  const summary: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (["content", "description", "summary"].includes(key)) {
      summary[key] = {
        type: "text",
        length: typeof item === "string" ? item.length : 0
      };
      continue;
    }
    if (
      item === null ||
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      (Array.isArray(item) &&
        item.every((entry) => typeof entry === "string"))
    ) {
      summary[key] = item;
    }
  }
  return summary;
}
