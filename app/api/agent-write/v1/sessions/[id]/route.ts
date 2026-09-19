import {
  agentWriteErrorResponse,
  isAgentWriteAdminAuthorized,
  revokeAgentWriteSession
} from "@/lib/agent-write";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAgentWriteAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    return Response.json({ session: await revokeAgentWriteSession(id) });
  } catch (error) {
    return agentWriteErrorResponse(error);
  }
}
