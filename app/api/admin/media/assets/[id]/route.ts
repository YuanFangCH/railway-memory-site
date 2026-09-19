import { auth } from "@/lib/auth/auth";
import { apiError } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { deleteMediaAssetIfUnused } from "@/lib/media/cleanup";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          videoFiles: true,
          videoPosters: true,
          images: true
        }
      },
      siteSetting: true
    }
  });

  if (!asset) {
    return apiError("媒体文件不存在", 404);
  }

  const referenced =
    asset._count.videoFiles +
    asset._count.videoPosters +
    asset._count.images +
    (asset.siteSetting ? 1 : 0);

  if (referenced > 0) {
    return apiError("该文件仍被内容引用，不能删除", 409);
  }

  await deleteMediaAssetIfUnused(asset.id);

  return Response.json({ ok: true });
}
