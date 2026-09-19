import { randomUUID } from "node:crypto";
import path from "node:path";

import { AgentWriteError, recordAgentWriteAudit } from "@/lib/agent-write";
import { prisma } from "@/lib/db";
import { mimeFromKey } from "@/lib/media/mime";
import { publicMediaUrl, storage } from "@/lib/storage";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

type WriteSession = {
  id: string;
  scopes: string[];
};

function safeExtension(filename: string, fallback: string) {
  const extension = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return extension && extension.length <= 10 ? extension : fallback;
}

function assetKey(kind: "images" | "videos", extension: string) {
  const now = new Date();
  const month = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `${kind}/${month}/${randomUUID()}${extension}`;
}

export async function uploadAgentMedia(session: WriteSession, file: File) {
  if (!session.scopes.includes("media:write")) {
    throw new AgentWriteError("write_scope_missing", 403);
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    throw new AgentWriteError("only_image_or_video_allowed", 415);
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size <= 0) {
    throw new AgentWriteError("empty_file", 400);
  }
  if (file.size > maxBytes) {
    throw new AgentWriteError(
      isImage ? "image_too_large" : "video_too_large",
      413
    );
  }

  let width: number | null = null;
  let height: number | null = null;
  let originalKey = "";
  let thumbnailKey: string | null = null;

  try {
    if (isImage) {
      originalKey = assetKey("images", safeExtension(file.name, ".jpg"));
      const buffer = Buffer.from(await file.arrayBuffer());
      const sharp = (await import("sharp")).default;
      const metadata = await sharp(buffer, { failOn: "none" }).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
      if (!width || !height) {
        throw new AgentWriteError("invalid_image_dimensions", 415);
      }
      await storage.put(originalKey, buffer);
      thumbnailKey = assetKey("images", ".webp");
      const thumbnail = await sharp(buffer, { failOn: "none" })
        .rotate()
        .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();
      await storage.put(thumbnailKey, thumbnail);
    } else {
      originalKey = assetKey(
        "videos",
        file.type === "video/webm" ? ".webm" : ".mp4"
      );
      await storage.put(
        originalKey,
        file.stream() as unknown as NodeJS.ReadableStream
      );
    }

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
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "upload",
      contentType: "media",
      contentId: asset.id,
      success: true,
      request: {
        originalName: file.name,
        mimeType: file.type,
        size: file.size
      },
      result: {
        id: asset.id,
        kind: asset.kind,
        publicUrl: asset.publicUrl
      }
    });
    return asset;
  } catch (error) {
    if (originalKey) {
      await storage.delete(originalKey).catch(() => undefined);
    }
    if (thumbnailKey) {
      await storage.delete(thumbnailKey).catch(() => undefined);
    }
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "upload",
      contentType: "media",
      success: false,
      error: error instanceof Error ? error.message : "upload_failed",
      request: { originalName: file.name, mimeType: file.type, size: file.size }
    }).catch(() => undefined);
    throw error;
  }
}
