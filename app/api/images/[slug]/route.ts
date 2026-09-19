import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const image = await prisma.image.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { asset: true }
  });

  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(image);
}
