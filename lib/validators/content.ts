import { z } from "zod";

export const contentStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED"
]);

export const optionalId = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const baseContent = {
  title: z.string().trim().min(1, "标题不能为空").max(200, "标题过长"),
  slug: z
    .string()
    .trim()
    .max(160, "slug 过长")
    .optional()
    .or(z.literal("")),
  status: contentStatusSchema,
  seoTitle: z.string().trim().max(200, "SEO 标题过长").optional().nullable(),
  seoDescription: z
    .string()
    .trim()
    .max(300, "SEO 描述过长")
    .optional()
    .nullable(),
  categoryId: optionalId,
  tagNames: z.array(z.string().trim().min(1).max(40)).max(20).default([])
};

export const postSchema = z.object({
  ...baseContent,
  summary: z.string().trim().min(1, "摘要不能为空").max(600, "摘要过长"),
  content: z.string().min(1, "正文不能为空").max(2_000_000, "正文过长"),
  coverImageId: optionalId
});

export const videoSchema = z.object({
  ...baseContent,
  description: z
    .string()
    .trim()
    .min(1, "描述不能为空")
    .max(20_000, "描述过长"),
  videoAssetId: z.string().min(1, "请先上传视频文件"),
  posterAssetId: optionalId
});

export const imageSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(200, "标题过长"),
  slug: z
    .string()
    .trim()
    .max(160, "slug 过长")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().min(1, "描述不能为空").max(20_000, "描述过长"),
  album: z.string().trim().max(100).optional().nullable(),
  status: contentStatusSchema,
  seoTitle: z.string().trim().max(200).optional().nullable(),
  seoDescription: z.string().trim().max(300).optional().nullable(),
  assetId: z.string().min(1, "请先上传图片文件")
});

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1).max(200),
  siteDescription: z.string().trim().min(1).max(1000),
  siteUrl: z.string().url("请输入有效的站点地址"),
  avatarAssetId: optionalId,
  socialLinks: z.array(
    z.object({
      label: z.string().trim().min(1).max(50),
      url: z.string().url("请输入有效的链接")
    })
  ),
  seoTitleTemplate: z.string().trim().min(1).max(200)
});

export type PostInput = z.infer<typeof postSchema>;
export type VideoInput = z.infer<typeof videoSchema>;
export type ImageInput = z.infer<typeof imageSchema>;
