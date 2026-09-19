import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const video = await prisma.video.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      tags: true,
      videoAsset: true,
      posterAsset: true
    }
  });

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(video);
}
