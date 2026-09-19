import {
  agentWriteErrorResponse,
  recordAgentWriteAudit,
  requireAgentWriteSession,
  summarizeAgentWriteRequest
} from "@/lib/agent-write";
import { updateAgentVideoDraft } from "@/lib/agent-write-content";
import { parseJson } from "@/lib/api/helpers";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session: Awaited<ReturnType<typeof requireAgentWriteSession>> | null = null;
  let payload: unknown = null;
  try {
    session = await requireAgentWriteSession(request);
    const { id } = await params;
    const parsed = await parseJson(request);
    if (!parsed.ok) {
      return parsed.response;
    }
    payload = parsed.data;
    return Response.json({
      video: await updateAgentVideoDraft(session, id, payload)
    });
  } catch (error) {
    if (session) {
      await recordAgentWriteAudit({
        sessionId: session.id,
        action: "update",
        contentType: "video",
        success: false,
        error: error instanceof Error ? error.message : "write_failed",
        request: summarizeAgentWriteRequest(payload)
      }).catch(() => undefined);
    }
    return agentWriteErrorResponse(error);
  }
}
