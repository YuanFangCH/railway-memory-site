"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AssetUploadField,
  type SelectedAsset
} from "@/components/admin/asset-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const imageFormSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空"),
  slug: z.string(),
  description: z.string().trim().min(1, "描述不能为空"),
  album: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seoTitle: z.string(),
  seoDescription: z.string()
});

type ImageFormValues = z.infer<typeof imageFormSchema>;

type ImageRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  album: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  seoTitle: string | null;
  seoDescription: string | null;
  assetId: string;
  asset: {
    originalName: string;
    publicUrl: string;
    thumbnailUrl: string | null;
  };
};

export function ImageForm({ image }: { image?: ImageRecord }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [asset, setAsset] = useState<SelectedAsset | null>(
    image
      ? {
          id: image.assetId,
          originalName: image.asset.originalName,
          publicUrl: image.asset.publicUrl,
          thumbnailUrl: image.asset.thumbnailUrl
        }
      : null
  );
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ImageFormValues>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      title: image?.title || "",
      slug: image?.slug || "",
      description: image?.description || "",
      album: image?.album || "",
      status: image?.status || "DRAFT",
      seoTitle: image?.seoTitle || "",
      seoDescription: image?.seoDescription || ""
    }
  });

  async function onSubmit(values: ImageFormValues) {
    if (!asset) {
      toast.error("请先上传图片");
      return;
    }

    setSaving(true);
    const response = await fetch(
      image ? `/api/admin/images/${image.id}` : "/api/admin/images",
      {
        method: image ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          assetId: asset.id,
          album: values.album || null,
          seoTitle: values.seoTitle || null,
          seoDescription: values.seoDescription || null
        })
      }
    );
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error || "保存失败");
      return;
    }

    toast.success(image ? "图片已更新" : "图片已创建");
    router.push("/admin/photos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
      <div className="grid gap-5 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="grid gap-2">
          <Label htmlFor="title">标题</Label>
          <Input id="title" placeholder="图片标题" {...register("title")} />
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="图片说明"
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="album">相册</Label>
          <Input id="album" placeholder="相册名称，可留空" {...register("album")} />
        </div>
        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            SEO 设置
          </summary>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="seoTitle">SEO 标题</Label>
              <Input id="seoTitle" {...register("seoTitle")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="seoDescription">SEO 描述</Label>
              <Textarea
                id="seoDescription"
                rows={3}
                {...register("seoDescription")}
              />
            </div>
          </div>
        </details>
      </div>
      <aside className="grid content-start gap-5 rounded-lg border bg-card p-5 text-card-foreground">
        <AssetUploadField
          label="图片文件"
          kind="image"
          value={asset}
          onChange={setAsset}
        />
        <div className="grid gap-2">
          <Label htmlFor="status">状态</Label>
          <Select id="status" {...register("status")}>
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">发布</option>
            <option value="ARCHIVED">下架</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" placeholder="留空自动生成" {...register("slug")} />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {image ? "保存修改" : "创建图片"}
        </Button>
      </aside>
    </form>
  );
}
