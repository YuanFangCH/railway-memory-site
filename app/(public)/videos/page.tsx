import { PageHeader } from "@/components/public/page-header";
import { Pagination } from "@/components/public/pagination";
import { VideoCard } from "@/components/public/video-card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function VideosPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: true,
        posterAsset: true
      }
    }),
    prisma.video.count({ where: { status: "PUBLISHED" } })
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Films"
        title="视频"
        description="现场影像、访谈与口述记录"
      />
      <section className="mt-8">
        {videos.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={{
                    slug: video.slug,
                    title: video.title,
                    description: video.description,
                    publishedAt: video.publishedAt,
                    category: video.category,
                    posterAsset: video.posterAsset
                  }}
                />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                basePath="/videos"
                page={page}
                totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
              />
            </div>
          </>
        ) : (
          <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            还没有已发布的视频
          </p>
        )}
      </section>
    </div>
  );
}
