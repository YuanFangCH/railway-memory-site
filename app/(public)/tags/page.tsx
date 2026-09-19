import Link from "next/link";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TagsIndexPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: { where: { status: "PUBLISHED" } },
          videos: { where: { status: "PUBLISHED" } }
        }
      }
    }
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <header className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-normal">标签</h1>
        <p className="mt-2 text-muted-foreground">按标签浏览文章与视频</p>
      </header>
      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="rounded-md border bg-card px-3 py-2 text-sm font-medium text-card-foreground hover:border-primary hover:text-primary"
          >
            {tag.name}
            <span className="ml-1 text-muted-foreground">
              {tag._count.posts + tag._count.videos}
            </span>
          </Link>
        ))}
      </div>
      {tags.length === 0 ? (
        <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          还没有标签
        </p>
      ) : null}
    </div>
  );
}
