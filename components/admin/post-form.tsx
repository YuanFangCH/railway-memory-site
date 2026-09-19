"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CategoryOption = { id: string; name: string };
type TagOption = { id: string; name: string };
type ImageOption = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
};

type PostRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImageId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  categoryId: string | null;
  tags: { name: string }[];
};

const postFormSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空"),
  slug: z.string(),
  summary: z.string().trim().min(1, "摘要不能为空"),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  categoryId: z.string(),
  coverImageId: z.string(),
  tagText: z.string(),
  seoTitle: z.string(),
  seoDescription: z.string()
});

type PostFormValues = z.infer<typeof postFormSchema>;

export function PostForm({
  post,
  categories,
  tags,
  images
}: {
  post?: PostRecord;
  categories: CategoryOption[];
  tags: TagOption[];
  images: ImageOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState(post?.content || "");
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      summary: post?.summary || "",
      status: post?.status || "DRAFT",
      categoryId: post?.categoryId || "",
      coverImageId: post?.coverImageId || "",
      seoTitle: post?.seoTitle || "",
      seoDescription: post?.seoDescription || "",
      tagText: post?.tags.map((tag) => tag.name).join(", ") || ""
    }
  });

  const contentError = !content ? "正文不能为空" : null;

  async function onSubmit(values: PostFormValues) {
    setSaving(true);

    const payload = {
      ...values,
      tagNames: values.tagText
        .split(/[,，]/)
        .map((name) => name.trim())
        .filter(Boolean),
      categoryId: values.categoryId || null,
      coverImageId: values.coverImageId || null,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      content
    };

    const response = await fetch(
      post ? `/api/admin/posts/${post.id}` : "/api/admin/posts",
      {
        method: post ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error || "保存失败");
      return;
    }

    toast.success(post ? "文章已更新" : "文章已创建");
    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
        <div className="grid gap-5 rounded-lg border bg-card p-5 text-card-foreground">
          <div className="grid gap-2">
            <Label htmlFor="title">标题</Label>
            <Input id="title" placeholder="文章标题" {...register("title")} />
            {errors.title ? (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="summary">摘要</Label>
            <Textarea
              id="summary"
              rows={3}
              placeholder="用于列表和分享的简短摘要"
              {...register("summary")}
            />
            {errors.summary ? (
              <p className="text-sm text-destructive">
                {errors.summary.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
          <Label>正文</Label>
            <RichTextEditor
              value={post?.content}
              onChange={(html) => setContent(html)}
            />
            {contentError ? (
              <p className="text-sm text-destructive">{contentError}</p>
            ) : null}
          </div>
        </div>

        <aside className="grid content-start gap-5 rounded-lg border bg-card p-5 text-card-foreground lg:sticky lg:top-20">
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
            <Input
              id="slug"
              placeholder="留空自动生成"
              {...register("slug")}
            />
            {errors.slug ? (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            ) : null}
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
              list="tagSuggestions"
              {...register("tagText")}
            />
            <datalist id="tagSuggestions">
              {tags.map((tag) => (
                <option key={tag.id} value={tag.name} />
              ))}
            </datalist>
            {errors.tagText ? (
              <p className="text-sm text-destructive">
                {errors.tagText.message}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coverImageId">封面</Label>
            <Select id="coverImageId" {...register("coverImageId")}>
              <option value="">无封面</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  {image.title || image.id}
                </option>
              ))}
            </Select>
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
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {post ? "保存修改" : "创建文章"}
          </Button>
        </aside>
      </div>
    </form>
  );
}
