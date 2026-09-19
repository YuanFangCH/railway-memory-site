import { notFound } from "next/navigation";

import { PostForm } from "@/components/admin/post-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories, tags, images] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true,
        coverImage: true
      }
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.image.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        asset: {
          select: {
            thumbnailUrl: true,
            publicUrl: true
          }
        }
      }
    })
  ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">编辑文章</h1>
      <PostForm
        post={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          content: post.content,
          coverImageId: post.coverImageId,
          seoTitle: post.seoTitle,
          seoDescription: post.seoDescription,
          status: post.status,
          categoryId: post.categoryId,
          tags: post.tags
        }}
        categories={categories}
        tags={tags}
        images={images.map((image) => ({
          id: image.id,
          title: image.title,
          thumbnailUrl: image.asset.thumbnailUrl
        }))}
      />
    </div>
  );
}
