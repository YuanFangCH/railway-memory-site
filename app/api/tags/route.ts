import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await prisma.tag.findMany({
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

  return NextResponse.json(tags);
}
