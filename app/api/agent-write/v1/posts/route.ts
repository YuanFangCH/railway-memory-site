import {
  agentWriteErrorResponse,
  recordAgentWriteAudit,
  requireAgentWriteSession,
  summarizeAgentWriteRequest
} from "@/lib/agent-write";
import { createAgentPostDraft } from "@/lib/agent-write-content";
import { parseJson } from "@/lib/api/helpers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let session: Awaited<ReturnType<typeof requireAgentWriteSession>> | null = null;
  let payload: unknown = null;
  try {
    session = await requireAgentWriteSession(request);
    const parsed = await parseJson(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    payload = parsed.data;
    return Response.json(
      { post: await createAgentPostDraft(session, payload) },
      { status: 201 }
    );
  } catch (error) {
    if (session) {
      await recordAgentWriteAudit({
        sessionId: session.id,
        action: "create",
        contentType: "post",
        success: false,
        error: error instanceof Error ? error.message : "write_failed",
        request: summarizeAgentWriteRequest(payload)
      }).catch(() => undefined);
    }
    return agentWriteErrorResponse(error);
  }
}
