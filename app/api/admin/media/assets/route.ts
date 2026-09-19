import { auth } from "@/lib/auth/auth";
import { apiError } from "@/lib/api/helpers";
import { prisma } from "@/lib/db";
import type { MediaKind } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as MediaKind | null;
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize")) || 30));
  const where = kind ? { kind } : {};

  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.mediaAsset.count({ where })
  ]);

  return Response.json({ items, total, page, pageSize });
}
