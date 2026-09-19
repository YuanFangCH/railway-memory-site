import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize")) || 12));

  const [items, total] = await Promise.all([
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        tags: true,
        videoAsset: true,
        posterAsset: true
      }
    }),
    prisma.video.count({ where: { status: "PUBLISHED" } })
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
