import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export function resolveSlug(value?: string | null, title?: string) {
  const source = value && value.trim() ? value : title || "untitled";
  const slug = slugify(source);
  return slug || `content-${Date.now()}`;
}

export function resolveStatusDate(
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  existingPublishedAt: Date | null | undefined
) {
  if (status === "PUBLISHED") {
    return existingPublishedAt ?? new Date();
  }

  return null;
}

export async function upsertTags(tagNames: string[]) {
  const uniqueNames = Array.from(
    new Set(tagNames.map((name) => name.trim()).filter(Boolean))
  );

  const tags = await Promise.all(
    uniqueNames.map((name) =>
      prisma.tag.upsert({
        where: { slug: slugify(name) },
        update: { name },
        create: { name, slug: slugify(name) }
      })
    )
  );

  return tags;
}

export function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function connectTagsByNames(tagNames: string[]) {
  const tags = await upsertTags(tagNames);
  return { tags };
}

export async function getOrCreateCategory(categoryId: string | null) {
  if (!categoryId) {
    return null;
  }

  return prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });
}
