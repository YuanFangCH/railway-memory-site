import Link from "next/link";

import { MediaThumb } from "@/components/public/media-thumb";
import { PageHeader } from "@/components/public/page-header";
import { Pagination } from "@/components/public/pagination";
import { PhotoCard } from "@/components/public/photo-card";
import { pickAlbumCover } from "@/lib/album";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type AlbumCard = {
  name: string;
  count: number;
  cover: string | null;
};

export default async function PhotosPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; album?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const activeAlbum = params.album || null;

  const [albumStats, allAlbumRows] = await Promise.all([
    prisma.image.groupBy({
      by: ["album"],
      where: { status: "PUBLISHED", album: { not: null } },
      _count: { _all: true },
      orderBy: { album: "asc" }
    }),
    prisma.image.findMany({
      where: { status: "PUBLISHED", album: { not: null } },
      orderBy: [{ album: "asc" }, { publishedAt: "asc" }],
      select: {
        album: true,
        id: true,
        asset: { select: { thumbnailUrl: true, publicUrl: true } }
      }
    })
  ]);

  const albumCards: AlbumCard[] = albumStats
    .filter((stat): stat is typeof stat & { album: string } => Boolean(stat.album))
    .map((stat) => ({
      name: stat.album,
      count: stat._count._all,
      cover: pickAlbumCover(
        allAlbumRows.filter((row) => row.album === stat.album)
      )
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    });

  const where = {
    status: "PUBLISHED" as const,
    ...(activeAlbum ? { album: activeAlbum } : {})
  };
  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { asset: true }
    }),
    prisma.image.count({ where })
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Gallery"
        title="图片"
        description="按相册浏览站内图片"
      />

      {albumCards.length ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            相册
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {albumCards.map((album) => {
              const active = activeAlbum === album.name;
              return (
                <Link
                  key={album.name}
                  href={`/photos?album=${encodeURIComponent(album.name)}`}
                  className={`group relative block overflow-hidden rounded-lg border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    active ? "border-[#c8901f] ring-1 ring-[#c8901f]" : "border-border"
                  }`}
                >
                  <MediaThumb
                    src={album.cover}
                    alt={album.name}
                    title={album.name}
                    className="aspect-[4/3] w-full"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                    <p className="line-clamp-1 text-sm font-medium text-white">
                      {album.name}
                    </p>
                    <p className="text-xs text-white/75">{album.count} 张</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        {activeAlbum ? (
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[#c8901f]">
                Album
              </p>
              <h2 className="mt-1 text-xl font-semibold">相册 · {activeAlbum}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                共 {total} 张照片
              </p>
            </div>
            <Link
              href="/photos"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              查看全部照片
            </Link>
          </div>
        ) : null}

        {images.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {images.map((image) => (
                <PhotoCard
                  key={image.id}
                  image={{
                    slug: image.slug,
                    title: image.title,
                    description: image.description,
                    album: image.album,
                    asset: image.asset
                  }}
                />
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                basePath="/photos"
                page={page}
                totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                searchParams={activeAlbum ? { album: activeAlbum } : {}}
              />
            </div>
          </>
        ) : (
          <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            还没有已发布的图片
          </p>
        )}
      </section>
    </div>
  );
}
