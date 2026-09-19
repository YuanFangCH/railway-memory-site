import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/public/page-header";
import { SearchForm } from "@/components/public/search-form";
import { searchContent } from "@/lib/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "搜索"
};

const typeLabels = {
  post: "文章",
  video: "视频",
  image: "图片"
} as const;

const basePaths = {
  post: "/posts",
  video: "/videos",
  image: "/photos"
} as const;

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || "";
  const results = q ? await searchContent(q) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Search"
        title="搜索"
        description="在标题、摘要、正文与描述中查找内容"
      />
      <div className="mt-6">
        <SearchForm initialValue={q} />
      </div>
      <section className="mt-8">
        {q && results.length === 0 ? (
          <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            没有找到与“{q}”相关的内容
          </p>
        ) : null}
        {!q ? (
          <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            输入关键词开始搜索
          </p>
        ) : null}
        {q && results.length ? (
          <div className="grid gap-3">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={`${basePaths[result.type]}/${result.slug}`}
                className="rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:border-primary/50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-primary">
                    {typeLabels[result.type]}
                  </span>
                  <h2 className="font-semibold hover:text-primary">
                    {result.title}
                  </h2>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {result.excerpt}
                </p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
