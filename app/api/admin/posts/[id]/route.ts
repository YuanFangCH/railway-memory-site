import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { connectTagsByNames, isUniqueConstraintError, resolveSlug, resolveStatusDate } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { postSchema } from "@/lib/validators/content";
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
  const existing = await prisma.post.findUnique({ where: { id } });

  if (!existing) {
    return apiError("文章不存在", 404);
  }

  const parsedBody = await parseJson(request);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = postSchema.safeParse(parsedBody.data);

  if (!result.success) {
    return apiError(result.error.issues[0]?.message || "参数不合法");
  }

  const input = result.data;
  const category = input.categoryId
    ? await prisma.category.findUnique({ where: { id: input.categoryId } })
    : null;
  const tags = await connectTagsByNames(input.tagNames);

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        slug: resolveSlug(input.slug, input.title),
        title: input.title,
        summary: input.summary,
        content: input.content,
        coverImageId: input.coverImageId,
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
        tags: true
      }
    });

    return NextResponse.json(post);
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
  const existing = await prisma.post.findUnique({ where: { id } });

  if (!existing) {
    return apiError("文章不存在", 404);
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

  const post = await prisma.post.update({
    where: { id },
    data: {
      status: result.data.status,
      publishedAt: resolveStatusDate(result.data.status, existing.publishedAt)
    }
  });

  return NextResponse.json(post);
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
  const existing = await prisma.post.findUnique({ where: { id } });

  if (!existing) {
    return apiError("文章不存在", 404);
  }

  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
