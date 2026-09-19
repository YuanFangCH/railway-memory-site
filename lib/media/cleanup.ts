import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";

export async function deleteMediaAssetIfUnused(assetId: string) {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: assetId },
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
    return;
  }

  const referenced =
    asset._count.videoFiles +
    asset._count.videoPosters +
    asset._count.images +
    (asset.siteSetting ? 1 : 0);

  if (referenced > 0) {
    return;
  }

  await prisma.mediaAsset.delete({ where: { id: asset.id } });
  await storage.delete(asset.storageKey);

  if (asset.thumbnailStorageKey) {
    await storage.delete(asset.thumbnailStorageKey);
  }
}
