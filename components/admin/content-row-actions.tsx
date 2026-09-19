"use client";

import { Archive, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ContentType = "posts" | "videos" | "images";

export function ContentRowActions({
  type,
  id,
  status
}: {
  type: ContentType;
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function changeStatus(nextStatus: string) {
    setLoading(nextStatus);
    const response = await fetch(`/api/admin/${type}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    setLoading(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error || "操作失败");
      return;
    }

    toast.success(nextStatus === "PUBLISHED" ? "已发布" : "状态已更新");
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("确定删除这条内容？此操作不可撤销。")) {
      return;
    }

    setLoading("delete");
    const response = await fetch(`/api/admin/${type}/${id}`, {
      method: "DELETE"
    });
    setLoading(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error || "删除失败");
      return;
    }

    toast.success("已删除");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status === "PUBLISHED" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => changeStatus("ARCHIVED")}
        >
          <Archive className="size-3.5" />
          下架
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading !== null}
          onClick={() => changeStatus("PUBLISHED")}
        >
          <Send className="size-3.5" />
          发布
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={loading !== null}
        onClick={remove}
      >
        <Trash2 className="size-3.5" />
        删除
      </Button>
    </div>
  );
}
