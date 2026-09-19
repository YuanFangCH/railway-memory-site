import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [postCount, videoCount, imageCount, assetCount] = await Promise.all([
    prisma.post.count(),
    prisma.video.count(),
    prisma.image.count(),
    prisma.mediaAsset.count()
  ]);

  const stats = [
    { label: "文章", value: postCount },
    { label: "视频", value: videoCount },
    { label: "图片", value: imageCount },
    { label: "媒体文件", value: assetCount }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">概览</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理帖子、视频、图片与媒体文件
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-card p-5 text-card-foreground"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-normal">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
