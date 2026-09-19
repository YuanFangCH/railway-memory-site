import { NextResponse } from "next/server";

import { connectTagsByNames, isUniqueConstraintError, resolveSlug, resolveStatusDate } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { videoSchema } from "@/lib/validators/content";
import type { ContentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));
  const status = url.searchParams.get("status") as ContentStatus | null;
  const where = status ? { status } : {};

  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
        videoAsset: true,
        posterAsset: true
      }
    }),
    prisma.video.count({ where })
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
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
    const video = await prisma.video.create({
      data: {
        slug: resolveSlug(input.slug, input.title),
        title: input.title,
        description: input.description,
        videoAssetId: videoAsset.id,
        posterAssetId: input.posterAssetId || null,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        status: input.status,
        publishedAt: resolveStatusDate(input.status, null),
        categoryId: category?.id || null,
        tags: {
          connect: tags.tags.map((tag) => ({ id: tag.id }))
        }
      },
      include: {
        category: true,
        tags: true,
        videoAsset: true,
        posterAsset: true
      }
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError("slug 已存在，请更换", 409);
    }

    throw error;
  }
}
