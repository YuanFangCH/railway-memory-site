import { isAgentWriteAdminAuthorized } from "@/lib/agent-write";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAgentWriteAdminAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const items = await prisma.agentWriteAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      session: {
        select: {
          purpose: true,
          createdBy: true
        }
      }
    }
  });
  return Response.json({
    items: items.map((item) => ({
      id: item.id,
      sessionId: item.sessionId,
      purpose: item.session.purpose,
      createdBy: item.session.createdBy,
      action: item.action,
      contentType: item.contentType,
      contentId: item.contentId,
      success: item.success,
      error: item.error,
      createdAt: item.createdAt.toISOString()
    }))
  });
}
