import { NextResponse } from "next/server";

import { connectTagsByNames, isUniqueConstraintError, resolveSlug, resolveStatusDate } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { deleteMediaAssetIfUnused } from "@/lib/media/cleanup";
import { videoSchema } from "@/lib/validators/content";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const existing = await prisma.video.findUnique({ where: { id } });

  if (!existing) {
    return apiError("视频不存在", 404);
  }

  const parsedBody = await parseJson(request);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = videoSchema.safeParse(parsedBody.data);

  if (!result.success) {
    return apiError(result.error.issues[0]?.message || "参数不合法");
  }

  const input = result.data;
  const [videoAsset, posterAsset, category] = await Promise.all([
    prisma.mediaAsset.findUnique({ where: { id: input.videoAssetId } }),
    input.posterAssetId
      ? prisma.mediaAsset.findUnique({ where: { id: input.posterAssetId } })
      : null,
    input.categoryId
      ? prisma.category.findUnique({ where: { id: input.categoryId } })
      : null
  ]);

  if (!videoAsset) {
    return apiError("视频文件不存在", 400);
  }

  if (input.posterAssetId && !posterAsset) {
    return apiError("封面图片不存在", 400);
  }

  const tags = await connectTagsByNames(input.tagNames);

  try {
    const video = await prisma.video.update({
      where: { id },
      data: {
        slug: resolveSlug(input.slug, input.title),
        title: input.title,
        description: input.description,
        videoAssetId: videoAsset.id,
        posterAssetId: input.posterAssetId || null,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        status: input.status,
        publishedAt: resolveStatusDate(input.status, existing.publishedAt),
        categoryId: category?.id || null,
        tags: {
          set: tags.tags.map((tag) => ({ id: tag.id }))
        }
      },
      include: {
        category: true,
        tags: true,
        videoAsset: true,
        posterAsset: true
      }
    });

    return NextResponse.json(video);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError("slug 已存在，请更换", 409);
    }

    throw error;
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const existing = await prisma.video.findUnique({ where: { id } });

  if (!existing) {
    return apiError("视频不存在", 404);
  }

  const parsedBody = await parseJson(request);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = z
    .object({ status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]) })
    .safeParse(parsedBody.data);

  if (!result.success) {
    return apiError("状态不合法");
  }

  const video = await prisma.video.update({
    where: { id },
    data: {
      status: result.data.status,
      publishedAt: resolveStatusDate(result.data.status, existing.publishedAt)
    }
  });

  return NextResponse.json(video);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;
  const existing = await prisma.video.findUnique({
    where: { id },
    select: {
      id: true,
      videoAssetId: true,
      posterAssetId: true
    }
  });

  if (!existing) {
    return apiError("视频不存在", 404);
  }

  await prisma.video.delete({ where: { id } });
  await deleteMediaAssetIfUnused(existing.videoAssetId);

  if (existing.posterAssetId) {
    await deleteMediaAssetIfUnused(existing.posterAssetId);
  }

  return NextResponse.json({ ok: true });
}
