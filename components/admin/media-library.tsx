"use client";

import { FileVideo2, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type MediaAssetItem = {
  id: string;
  kind: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  publicUrl: string;
  thumbnailUrl: string | null;
  createdAt: string;
  references: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaLibrary({ assets }: { assets: MediaAssetItem[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        toast.error(data?.error || "上传失败");
        return;
      }

      toast.success("上传完成");
      router.refresh();
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function remove(id: string) {
    if (!window.confirm("确定删除这个媒体文件？")) {
      return;
    }

    setDeleting(id);
    const response = await fetch(`/api/admin/media/assets/${id}`, {
      method: "DELETE"
    });
    setDeleting(null);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error || "删除失败");
      return;
    }

    toast.success("媒体文件已删除");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <label
        className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-card p-5 text-center text-sm text-muted-foreground hover:border-primary hover:text-primary"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,video/mp4,video/webm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void upload(file);
            }
          }}
        />
        {uploading ? (
          <Loader2 className="size-6 animate-spin" />
        ) : (
          <Upload className="size-6" />
        )}
        <span>{uploading ? "上传中" : "上传图片或视频"}</span>
        <span>图片最大 15 MB，视频最大 500 MB</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="overflow-hidden rounded-lg border bg-card text-card-foreground"
          >
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {asset.kind === "IMAGE" && asset.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.thumbnailUrl}
                  alt={asset.originalName}
                  className="h-full w-full object-cover"
                />
              ) : asset.kind === "IMAGE" ? (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="size-10 text-muted-foreground" />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FileVideo2 className="size-12 text-primary" />
                </div>
              )}
            </div>
            <div className="grid gap-2 p-3">
              <p className="truncate text-sm font-medium" title={asset.originalName}>
                {asset.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {asset.kind === "VIDEO" ? "视频" : "图片"} ·{" "}
                {formatBytes(asset.size)}
                {asset.width && asset.height
                  ? ` · ${asset.width}×${asset.height}`
                  : ""}
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {asset.references > 0
                    ? `被 ${asset.references} 条内容引用`
                    : "未使用"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="删除文件"
                  title="删除文件"
                  disabled={deleting === asset.id || asset.references > 0}
                  onClick={() => remove(asset.id)}
                >
                  {deleting === asset.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {assets.length === 0 ? (
        <p className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          还没有媒体文件
        </p>
      ) : null}
    </div>
  );
}
