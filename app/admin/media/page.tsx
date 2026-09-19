import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaLibrary } from "@/components/admin/media-library";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="媒体库"
        description="上传和管理图片与视频文件"
      />
      <MediaLibrary
        assets={assets.map((asset) => ({
          id: asset.id,
          kind: asset.kind,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          size: asset.size,
          width: asset.width,
          height: asset.height,
          publicUrl: asset.publicUrl,
          thumbnailUrl: asset.thumbnailUrl,
          createdAt: asset.createdAt.toISOString(),
          references:
            asset._count.videoFiles +
            asset._count.videoPosters +
            asset._count.images +
            (asset.siteSetting ? 1 : 0)
        }))}
      />
    </div>
  );
}
