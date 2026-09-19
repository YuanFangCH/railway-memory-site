import { NextResponse } from "next/server";

import { isUniqueConstraintError, resolveSlug, resolveStatusDate } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { deleteMediaAssetIfUnused } from "@/lib/media/cleanup";
import { imageSchema } from "@/lib/validators/content";
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
  const existing = await prisma.image.findUnique({ where: { id } });

  if (!existing) {
    return apiError("图片不存在", 404);
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
    const image = await prisma.image.update({
      where: { id },
      data: {
        slug: resolveSlug(input.slug, input.title),
        title: input.title,
        description: input.description,
        album: input.album || null,
        assetId: asset.id,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        status: input.status,
        publishedAt: resolveStatusDate(input.status, existing.publishedAt)
      },
      include: { asset: true }
    });

    return NextResponse.json(image);
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
  const existing = await prisma.image.findUnique({ where: { id } });

  if (!existing) {
    return apiError("图片不存在", 404);
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

  const image = await prisma.image.update({
    where: { id },
    data: {
      status: result.data.status,
      publishedAt: resolveStatusDate(result.data.status, existing.publishedAt)
    }
  });

  return NextResponse.json(image);
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
  const existing = await prisma.image.findUnique({
    where: { id },
    select: { id: true, assetId: true }
  });

  if (!existing) {
    return apiError("图片不存在", 404);
  }

  await prisma.image.delete({ where: { id } });
  await deleteMediaAssetIfUnused(existing.assetId);

  return NextResponse.json({ ok: true });
}
