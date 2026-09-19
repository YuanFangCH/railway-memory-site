import { NextResponse } from "next/server";

import {
  buildAgentExport,
  InvalidAgentCursorError,
  isAgentExportAuthorized
} from "@/lib/agent-export";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.GUIDE_AGENT_EXPORT_TOKEN?.trim()) {
    return NextResponse.json(
      { error: "agent_export_not_configured" },
      { status: 503 }
    );
  }

  if (!isAgentExportAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") === "manifest" ? "manifest" : "incremental";
  const limit = Math.min(
    500,
    Math.max(1, Number(url.searchParams.get("limit")) || 200)
  );

  try {
    const payload = await buildAgentExport({
      cursor: url.searchParams.get("cursor"),
      limit,
      mode
    });

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    if (error instanceof InvalidAgentCursorError) {
      return NextResponse.json({ error: "invalid_cursor" }, { status: 400 });
    }

    throw error;
  }
}
