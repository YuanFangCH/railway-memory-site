import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { connectTagsByNames, isUniqueConstraintError, resolveSlug, resolveStatusDate } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import { postSchema } from "@/lib/validators/content";
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
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
        coverImage: {
          select: {
            id: true,
            title: true,
            asset: {
              select: {
                thumbnailUrl: true,
                publicUrl: true
              }
            }
          }
        }
      }
    }),
    prisma.post.count({ where })
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

  const result = postSchema.safeParse(parsedBody.data);

  if (!result.success) {
    return apiError(result.error.issues[0]?.message || "参数不合法");
  }

  const input = result.data;
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId || "not-found" }
  });
  const tags = await connectTagsByNames(input.tagNames);
  const slug = resolveSlug(input.slug, input.title);
  const publishedAt = resolveStatusDate(input.status, null);

  try {
    const post = await prisma.post.create({
      data: {
        slug,
        title: input.title,
        summary: input.summary,
        content: input.content,
        coverImageId: input.coverImageId,
        seoTitle: input.seoTitle || null,
        seoDescription: input.seoDescription || null,
        status: input.status,
        publishedAt,
        categoryId: category?.id || null,
        tags: {
          connect: tags.tags.map((tag) => ({ id: tag.id }))
        }
      },
      include: {
        category: true,
        tags: true
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError("slug 已存在，请更换", 409);
    }

    throw error;
  }
}
