import { VideoForm } from "@/components/admin/video-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewVideoPage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.tag.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">新建视频</h1>
      <VideoForm categories={categories} tags={tags} />
    </div>
  );
}
