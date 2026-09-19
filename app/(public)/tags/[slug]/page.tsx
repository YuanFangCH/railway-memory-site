import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/public/post-card";
import { VideoCard } from "@/components/public/video-card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: { name: true }
  });
  return { title: tag ? `标签：${tag.name}` : "标签" };
}

export default async function TagPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 30,
        include: {
          category: true,
          tags: true,
          coverImage: { include: { asset: true } }
        }
      },
      videos: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 30,
        include: {
          category: true,
          posterAsset: true
        }
      }
    }
  });

  if (!tag) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-normal">#{tag.name}</h1>
        <p className="mt-2 text-muted-foreground">
          相关文章 {tag.posts.length} 篇，视频 {tag.videos.length} 个
        </p>
      </header>
      {tag.posts.length ? (
        <section className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">文章</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tag.posts.map((post) => (
              <PostCard
                key={post.id}
                post={{
                  slug: post.slug,
                  title: post.title,
                  summary: post.summary,
                  publishedAt: post.publishedAt,
                  category: post.category,
                  tags: post.tags,
                  coverImage: post.coverImage
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
      {tag.videos.length ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold tracking-normal">视频</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tag.videos.map((video) => (
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
        </section>
      ) : null}
      {!tag.posts.length && !tag.videos.length ? (
        <p className="mt-8 rounded-lg border bg-card p-10 text-center text-muted-foreground">
          这个标签下还没有已发布内容
        </p>
      ) : null}
    </div>
  );
}
