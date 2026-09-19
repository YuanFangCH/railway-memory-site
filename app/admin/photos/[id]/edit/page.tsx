import { notFound } from "next/navigation";

import { ImageForm } from "@/components/admin/image-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditPhotoPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const image = await prisma.image.findUnique({
    where: { id },
    include: { asset: true }
  });

  if (!image) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">编辑图片</h1>
      <ImageForm
        image={{
          id: image.id,
          title: image.title,
          slug: image.slug,
          description: image.description,
          album: image.album,
          status: image.status,
          seoTitle: image.seoTitle,
          seoDescription: image.seoDescription,
          assetId: image.assetId,
          asset: {
            originalName: image.asset.originalName,
            publicUrl: image.asset.publicUrl,
            thumbnailUrl: image.asset.thumbnailUrl
          }
        }}
      />
    </div>
  );
}
