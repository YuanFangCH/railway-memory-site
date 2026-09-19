import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/date";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const image = await prisma.image.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      title: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      asset: { select: { publicUrl: true } }
    }
  });

  if (!image) {
    return {};
  }

  return {
    title: image.seoTitle || image.title,
    description: image.seoDescription || image.description,
    openGraph: {
      title: image.seoTitle || image.title,
      description: image.seoDescription || image.description,
      images: [{ url: image.asset.publicUrl }]
    }
  };
}

export default async function PhotoDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const image = await prisma.image.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { asset: true }
  });

  if (!image) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/photos" className="text-sm font-medium text-primary hover:underline">
        返回图片列表
      </Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="overflow-hidden rounded-lg border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.asset.publicUrl}
            alt={image.title}
            className="h-auto w-full"
          />
        </div>
        <aside className="rounded-lg border bg-card p-5 text-card-foreground">
          <h1 className="text-2xl font-bold tracking-normal">{image.title}</h1>
          <dl className="mt-5 grid gap-4 text-sm">
            {image.publishedAt ? (
              <div>
                <dt className="text-muted-foreground">日期</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(image.publishedAt)}
                </dd>
              </div>
            ) : null}
            {image.album ? (
              <div>
                <dt className="text-muted-foreground">相册</dt>
                <dd className="mt-1 font-medium">{image.album}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">尺寸</dt>
              <dd className="mt-1 font-medium">
                {image.asset.width && image.asset.height
                  ? `${image.asset.width} × ${image.asset.height}`
                  : "未知"}
              </dd>
            </div>
          </dl>
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {image.description}
          </p>
        </aside>
      </div>
    </article>
  );
}
