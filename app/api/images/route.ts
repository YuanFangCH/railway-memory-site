import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(60, Math.max(1, Number(url.searchParams.get("pageSize")) || 24));
  const album = url.searchParams.get("album");

  const where = {
    status: "PUBLISHED" as const,
    ...(album ? { album } : {})
  };

  const [items, total] = await Promise.all([
    prisma.image.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { asset: true }
    }),
    prisma.image.count({ where })
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}
