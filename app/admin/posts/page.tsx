import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentStatusBadge } from "@/components/admin/content-status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      category: true,
      tags: true
    }
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="文章"
        description="管理文章内容、分类、标签与发布状态"
        href="/admin/posts/new"
        actionLabel="新建文章"
      />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">标签</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id} className="align-middle">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="font-medium hover:text-primary"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                    {post.slug}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {post.category?.name || (
                    <span className="text-muted-foreground">未分类</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-56 flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {post.tags.length > 3 ? (
                      <span className="text-xs text-muted-foreground">
                        +{post.tags.length - 3}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ContentStatusBadge status={post.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/posts/${post.id}/edit`}>编辑</Link>
                    </Button>
                    <ContentRowActions
                      type="posts"
                      id={post.id}
                      status={post.status}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  还没有文章
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
