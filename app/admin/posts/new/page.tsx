import { PostForm } from "@/components/admin/post-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const [categories, tags, images] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">新建文章</h1>
      <PostForm
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
