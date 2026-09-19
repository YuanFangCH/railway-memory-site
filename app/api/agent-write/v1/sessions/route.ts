import {
  agentWriteErrorResponse,
  createAgentWriteSession,
  isAgentWriteAdminAuthorized,
  listAgentWriteSessions,
  sessionCreateSchema
} from "@/lib/agent-write";
import { parseJson } from "@/lib/api/helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAgentWriteAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ items: await listAgentWriteSessions() });
}

export async function POST(request: Request) {
  if (!isAgentWriteAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsedBody = await parseJson(request);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }
  const parsed = sessionCreateSchema.safeParse(parsedBody.data);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message || "invalid_session" },
      { status: 400 }
    );
  }
  try {
    return Response.json(await createAgentWriteSession(parsed.data), {
      status: 201,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    return agentWriteErrorResponse(error);
  }
}
