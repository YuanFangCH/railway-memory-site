import { notFound } from "next/navigation";

import { VideoForm } from "@/components/admin/video-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [video, categories, tags] = await Promise.all([
    prisma.video.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true,
        videoAsset: true,
        posterAsset: true
      }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } })
  ]);

  if (!video) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">编辑视频</h1>
      <VideoForm
        video={{
          id: video.id,
          title: video.title,
          slug: video.slug,
          description: video.description,
          status: video.status,
          seoTitle: video.seoTitle,
          seoDescription: video.seoDescription,
          categoryId: video.categoryId,
          tags: video.tags,
          videoAsset: {
            id: video.videoAsset.id,
            originalName: video.videoAsset.originalName,
            publicUrl: video.videoAsset.publicUrl
          },
          posterAsset: video.posterAsset
            ? {
                id: video.posterAsset.id,
                originalName: video.posterAsset.originalName,
                publicUrl: video.posterAsset.publicUrl,
                thumbnailUrl: video.posterAsset.thumbnailUrl
              }
            : null
        }}
        categories={categories}
        tags={tags}
      />
    </div>
  );
}
