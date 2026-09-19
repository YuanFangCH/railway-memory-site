import { randomUUID } from "node:crypto";
import path from "node:path";

import { auth } from "@/lib/auth/auth";
import { apiError } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { mimeFromKey } from "@/lib/media/mime";
import { publicMediaUrl, storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

function safeExtension(filename: string, fallback: string) {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext && ext.length <= 10 ? ext : fallback;
}

function assetKey(kind: "images" | "videos", extension: string) {
  const now = new Date();
  const month = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${kind}/${month}/${randomUUID()}${extension}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return apiError("请选择要上传的文件", 400);
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    return apiError("仅支持图片或视频文件", 415);
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;

  if (file.size <= 0) {
    return apiError("文件内容为空", 400);
  }

  if (file.size > maxBytes) {
    return apiError(
      isImage ? "图片不能超过 15 MB" : "视频不能超过 500 MB",
      413
    );
  }

  let width: number | null = null;
  let height: number | null = null;
  let originalKey: string;
  let thumbnailKey: string | null = null;

  if (isImage) {
    const extension = safeExtension(file.name, ".jpg");
    originalKey = assetKey("images", extension);

    const buffer = Buffer.from(await file.arrayBuffer());
    let metadata;

    try {
      const sharp = (await import("sharp")).default;
      metadata = await sharp(buffer, { failOn: "none" }).metadata();
    } catch {
      await storage.delete(originalKey);
      return apiError("图片无法读取，请换一张图片", 415);
    }

    width = metadata.width ?? null;
    height = metadata.height ?? null;

    if (!width || !height) {
      await storage.delete(originalKey);
      return apiError("图片缺少有效尺寸", 415);
    }

    await storage.put(originalKey, buffer);
    thumbnailKey = assetKey("images", ".webp");

    try {
      const sharp = (await import("sharp")).default;
      const thumbnail = await sharp(buffer, { failOn: "none" })
        .rotate()
        .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      await storage.put(thumbnailKey, thumbnail);
    } catch {
      await storage.delete(originalKey);
      thumbnailKey = null;
      return apiError("图片处理失败", 500);
    }
  } else {
    const extension = file.type === "video/webm" ? ".webm" : ".mp4";
    originalKey = assetKey("videos", extension);
    await storage.put(originalKey, file.stream() as unknown as NodeJS.ReadableStream);
  }

  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        kind: isImage ? "IMAGE" : "VIDEO",
        originalName: file.name.slice(0, 240),
        mimeType: isImage ? file.type || mimeFromKey(originalKey) : file.type,
        size: file.size,
        width,
        height,
        storageKey: originalKey,
        thumbnailStorageKey: thumbnailKey,
        publicUrl: publicMediaUrl(originalKey),
        thumbnailUrl: thumbnailKey ? publicMediaUrl(thumbnailKey) : null
      }
    });

    return Response.json(asset, { status: 201 });
  } catch (error) {
    await storage.delete(originalKey);

    if (thumbnailKey) {
      await storage.delete(thumbnailKey);
    }

    throw error;
  }
}
