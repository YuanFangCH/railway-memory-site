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

type CategoryOption = { id: string; name: string };

const videoFormSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空"),
  slug: z.string(),
  description: z.string().trim().min(1, "描述不能为空"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  categoryId: z.string(),
  tagText: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string()
});

type VideoFormValues = z.infer<typeof videoFormSchema>;

type VideoRecord = {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string | null;
  tags: { name: string }[];
  videoAsset: {
    id: string;
    originalName: string;
    publicUrl: string;
  };
  posterAsset: {
    id: string;
    originalName: string;
    publicUrl: string;
    thumbnailUrl: string | null;
  } | null;
};

export function VideoForm({
  video,
  categories,
  tags
}: {
  video?: VideoRecord;
  categories: CategoryOption[];
  tags: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [videoAsset, setVideoAsset] = useState<SelectedAsset | null>(
    video
      ? {
          id: video.videoAsset.id,
          originalName: video.videoAsset.originalName,
          publicUrl: video.videoAsset.publicUrl
        }
      : null
  );
  const [posterAsset, setPosterAsset] = useState<SelectedAsset | null>(
    video?.posterAsset
      ? {
          id: video.posterAsset.id,
          originalName: video.posterAsset.originalName,
          publicUrl: video.posterAsset.publicUrl,
          thumbnailUrl: video.posterAsset.thumbnailUrl
        }
      : null
  );
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<VideoFormValues>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      title: video?.title || "",
      slug: video?.slug || "",
      description: video?.description || "",
      status: video?.status || "DRAFT",
      categoryId: video?.categoryId || "",
      tagText: video?.tags.map((tag) => tag.name).join(", ") || "",
      seoTitle: video?.seoTitle || "",
      seoDescription: video?.seoDescription || ""
    }
  });

  async function onSubmit(values: VideoFormValues) {
    if (!videoAsset) {
      toast.error("请先上传视频");
      return;
    }

    setSaving(true);
    const response = await fetch(
      video ? `/api/admin/videos/${video.id}` : "/api/admin/videos",
      {
        method: video ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          videoAssetId: videoAsset.id,
          posterAssetId: posterAsset?.id || null,
          categoryId: values.categoryId || null,
          tagNames: values.tagText
            .split(/[,，]/)
            .map((name) => name.trim())
            .filter(Boolean),
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

    toast.success(video ? "视频已更新" : "视频已创建");
    router.push("/admin/videos");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start"
    >
      <div className="grid gap-5 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="grid gap-2">
          <Label htmlFor="title">标题</Label>
          <Input id="title" placeholder="视频标题" {...register("title")} />
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            rows={5}
            placeholder="视频说明"
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          ) : null}
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
          label="视频文件"
          kind="video"
          value={videoAsset}
          onChange={setVideoAsset}
        />
        <AssetUploadField
          label="封面图片"
          kind="image"
          value={posterAsset}
          onChange={setPosterAsset}
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
          <Label htmlFor="categoryId">分类</Label>
          <Select id="categoryId" {...register("categoryId")}>
            <option value="">未分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tagText">标签</Label>
          <Input
            id="tagText"
            placeholder="用逗号分隔"
            list="videoTagSuggestions"
            {...register("tagText")}
          />
          <datalist id="videoTagSuggestions">
            {tags.map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
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
          {video ? "保存修改" : "创建视频"}
        </Button>
      </aside>
    </form>
  );
}
