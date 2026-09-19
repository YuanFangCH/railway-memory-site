import { Pagination } from "@/components/public/pagination";
import { PageHeader } from "@/components/public/page-header";
import { PostCard } from "@/components/public/post-card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function PostsPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const where = {
    status: "PUBLISHED" as const,
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.tag ? { tags: { some: { slug: params.tag } } } : {})
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: true,
        tags: true,
        coverImage: { include: { asset: true } }
      }
    }),
    prisma.post.count({ where })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Articles"
        title="文章"
        description="铁道文化、遗址考察与工业记忆的文字记录"
      />
      <section className="mt-8">
        {posts.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
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
            <div className="mt-8">
              <Pagination
                basePath="/posts"
                page={page}
                totalPages={totalPages}
              />
            </div>
          </>
        ) : (
          <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
            还没有已发布的文章
          </p>
        )}
      </section>
    </div>
  );
}
