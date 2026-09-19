import {
  agentWriteErrorResponse,
  requireAgentWriteSession
} from "@/lib/agent-write";
import { uploadAgentMedia } from "@/lib/agent-write-media";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireAgentWriteSession(request);
    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "file_required" }, { status: 400 });
    }
    return Response.json({ asset: await uploadAgentMedia(session, file) }, { status: 201 });
  } catch (error) {
    return agentWriteErrorResponse(error);
  }
}
