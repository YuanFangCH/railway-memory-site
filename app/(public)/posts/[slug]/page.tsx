import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaThumb } from "@/components/public/media-thumb";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/date";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      summary: true,
      seoTitle: true,
      seoDescription: true,
      coverImage: {
        select: {
          asset: { select: { publicUrl: true } }
        }
      }
    }
  });

  if (!post) {
    return {};
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.summary,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.summary,
      images: post.coverImage?.asset.publicUrl
        ? [{ url: post.coverImage.asset.publicUrl }]
        : []
    }
  };
}

export default async function PostDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      tags: true,
      coverImage: { include: { asset: true } }
    }
  });

  if (!post) {
    notFound();
  }

  const settings = await getSiteSettings();
  const image =
    post.coverImage?.asset.publicUrl || post.coverImage?.asset.thumbnailUrl;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: `${settings.siteUrl}/posts/${post.slug}`,
    image,
    author: {
      "@type": "Person",
      name: settings.siteName
    }
  };

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/posts"
        className="text-sm font-medium text-primary hover:underline"
      >
        返回文章列表
      </Link>
      <header className="mt-4 border-b pb-6">
        <h1 className="text-3xl font-bold leading-tight tracking-normal sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          ) : null}
          {post.category ? (
            <Link href={`/categories/${post.category.slug}`} className="hover:text-primary">
              {post.category.name}
            </Link>
          ) : null}
        </div>
        <p className="mt-4 text-base text-muted-foreground">{post.summary}</p>
      </header>
      {image ? (
        <MediaThumb
          src={image}
          alt={post.title}
          className="mt-6 aspect-video w-full overflow-hidden rounded-lg"
        />
      ) : null}
      <div
        className="prose-content mt-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
      <footer className="mt-10 border-t pt-5">
        {post.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.slug}`}>
                <Badge variant="outline">#{tag.name}</Badge>
              </Link>
            ))}
          </div>
        ) : null}
      </footer>
    </article>
  );
}
