import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await prisma.video.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      description: true,
      seoTitle: true,
      seoDescription: true
    }
  });

  if (!video) {
    return {};
  }

  return {
    title: video.seoTitle || video.title,
    description: video.seoDescription || video.description
  };
}

export default async function VideoDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await prisma.video.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      tags: true,
      videoAsset: true,
      posterAsset: true
    }
  });

  if (!video) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/videos" className="text-sm font-medium text-primary hover:underline">
        返回视频列表
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-normal sm:text-4xl">
        {video.title}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {video.publishedAt ? (
          <time dateTime={video.publishedAt.toISOString()}>
            {formatDate(video.publishedAt)}
          </time>
        ) : null}
        {video.category ? (
          <Link href={`/categories/${video.category.slug}`} className="hover:text-primary">
            {video.category.name}
          </Link>
        ) : null}
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border bg-black shadow-sm">
        <video
          src={video.videoAsset.publicUrl}
          poster={video.posterAsset?.publicUrl || undefined}
          controls
          preload="metadata"
          className="aspect-video w-full"
        >
          当前浏览器不支持 HTML5 视频播放
        </video>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_220px]">
        <p className="whitespace-pre-line text-muted-foreground">
          {video.description}
        </p>
        <aside>
          {video.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <Link key={tag.id} href={`/tags/${tag.slug}`}>
                  <Badge variant="outline">#{tag.name}</Badge>
                </Link>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
