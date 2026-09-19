import Link from "next/link";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Pagination({
  basePath,
  page,
  totalPages,
  searchParams = {}
}: {
  basePath: string;
  page: number;
  totalPages: number;
  searchParams?: Record<string, string>;
}) {
  function hrefFor(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronLeft className="size-4" />
          上一页
        </Link>
      </Button>
      <p className="text-sm text-muted-foreground">
        第 {page} / {totalPages} 页
      </p>
      <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          下一页
          <ChevronRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}
