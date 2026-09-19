"use client";

import { FileVideo2, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type SelectedAsset = {
  id: string;
  originalName: string;
  publicUrl: string;
  thumbnailUrl?: string | null;
};

export function AssetUploadField({
  label,
  kind,
  value,
  onChange
}: {
  label: string;
  kind: "image" | "video";
  value?: SelectedAsset | null;
  onChange: (asset: SelectedAsset | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
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

      const asset = (await response.json()) as SelectedAsset;
      onChange(asset);
      toast.success("上传完成");
    } catch {
      toast.error("上传失败，请稍后重试");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium leading-none">{label}</span>
      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
          <div className="flex min-w-0 items-center gap-2">
            {kind === "video" ? (
              <FileVideo2 className="size-5 shrink-0 text-primary" />
            ) : value.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.thumbnailUrl}
                alt=""
                className="size-10 shrink-0 rounded object-cover"
              />
            ) : (
              <ImagePlus className="size-5 shrink-0 text-primary" />
            )}
            <span className="truncate text-sm">{value.originalName}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="移除文件"
            title="移除文件"
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <label
          className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background p-4 text-center text-sm text-muted-foreground hover:border-primary hover:text-primary"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={kind === "image" ? "image/*" : "video/mp4,video/webm"}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleFile(file);
              }
            }}
          />
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : kind === "image" ? (
            <ImagePlus className="size-5" />
          ) : (
            <FileVideo2 className="size-5" />
          )}
          <span>{uploading ? "上传中" : "选择文件上传"}</span>
          <span className="text-xs">
            {kind === "image" ? "图片最大 15 MB" : "MP4/WebM 最大 500 MB"}
          </span>
        </label>
      )}
      {value ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          替换文件
        </Button>
      ) : null}
    </div>
  );
}
