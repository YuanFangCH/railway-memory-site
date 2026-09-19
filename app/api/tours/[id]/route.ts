import { NextResponse } from "next/server";

import { getGuidedTour } from "@/lib/tour";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tour = getGuidedTour(id);

  if (!tour) {
    return NextResponse.json({ error: "tour_not_found" }, { status: 404 });
  }

  return NextResponse.json(tour, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
