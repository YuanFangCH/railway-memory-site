import { NextResponse } from "next/server";

import { isUniqueConstraintError, resolveSlug, resolveStatusDate } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { imageSchema } from "@/lib/validators/content";
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
  const album = url.searchParams.get("album");
  const where = {
    ...(status ? { status } : {}),
    ...(album ? { album } : {})
  };

  const [items, total] = await Promise.all([
    prisma.image.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { asset: true }
    }),
    prisma.image.count({ where })
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

  const result = imageSchema.safeParse(parsedBody.data);

  if (!result.success) {
    return apiError(result.error.issues[0]?.message || "参数不合法");
  }

  const input = result.data;
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: input.assetId }
  });

  if (!asset) {
    return apiError("图片文件不存在", 400);
  }

  try {
    const image = await prisma.image.create({
      data: {
        slug: resolveSlug(input.slug, input.title),
        title: input.title,
        description: input.description,
        album: input.album || null,
        assetId: asset.id,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        status: input.status,
        publishedAt: resolveStatusDate(input.status, null)
      },
      include: { asset: true }
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError("slug 已存在，请更换", 409);
    }

    throw error;
  }
}
