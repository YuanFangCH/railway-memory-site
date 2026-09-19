import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  ARCHIVED: "已下架"
};

export function ContentStatusBadge({ status }: { status: string }) {
  const variant =
    status === "PUBLISHED"
      ? "default"
      : status === "ARCHIVED"
        ? "destructive"
        : "secondary";

  return <Badge variant={variant}>{labels[status] || status}</Badge>;
}
