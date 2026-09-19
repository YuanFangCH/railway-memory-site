import {
  agentWriteErrorResponse,
  recordAgentWriteAudit,
  requireAgentWriteSession
} from "@/lib/agent-write";
import { publishAgentVideo } from "@/lib/agent-write-content";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let session: Awaited<ReturnType<typeof requireAgentWriteSession>> | null = null;
  try {
    session = await requireAgentWriteSession(request);
    const { id } = await params;
    return Response.json({ video: await publishAgentVideo(session, id) });
  } catch (error) {
    if (session) {
      await recordAgentWriteAudit({
        sessionId: session.id,
        action: "publish",
        contentType: "video",
        success: false,
        error: error instanceof Error ? error.message : "write_failed",
        request: { id: (await params).id }
      }).catch(() => undefined);
    }
    return agentWriteErrorResponse(error);
  }
}
