import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          posts: { where: { status: "PUBLISHED" } },
          videos: { where: { status: "PUBLISHED" } }
        }
      }
    }
  });

  return NextResponse.json(categories);
}
