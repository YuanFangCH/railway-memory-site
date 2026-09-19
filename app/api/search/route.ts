import { NextResponse } from "next/server";

import { searchContent } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ items: [] });
  }

  const items = await searchContent(q);
  return NextResponse.json({ items });
}
