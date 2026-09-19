import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentStatusBadge } from "@/components/admin/content-status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const images = await prisma.image.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { asset: true }
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="图片"
        description="管理图片内容、相册与发布状态"
        href="/admin/photos/new"
        actionLabel="新建图片"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="overflow-hidden rounded-lg border bg-card text-card-foreground"
          >
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {image.asset.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.asset.thumbnailUrl}
                  alt={image.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  暂无缩略图
                </div>
              )}
            </div>
            <div className="grid gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/admin/photos/${image.id}/edit`}
                    className="line-clamp-1 font-medium hover:text-primary"
                  >
                    {image.title}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {image.album || "未分类相册"}
                  </p>
                </div>
                <ContentStatusBadge status={image.status} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/photos/${image.id}/edit`}>编辑</Link>
                </Button>
                <ContentRowActions
                  type="images"
                  id={image.id}
                  status={image.status}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {images.length === 0 ? (
        <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          还没有图片内容
        </p>
      ) : null}
    </div>
  );
}
