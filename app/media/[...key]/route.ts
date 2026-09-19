import { mimeFromKey } from "@/lib/media/mime";
import { parseRange } from "@/lib/media/range";
import { storage } from "@/lib/storage";

export const dynamic = "force-dynamic";

function buildHeaders(mimeType: string, size: number): Record<string, string> {
  return {
    "Content-Type": mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Length": String(size)
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  try {
    const mimeType = mimeFromKey(key);
    const size = await storage.head(key);
    const headers = buildHeaders(mimeType, size);
    const rangeHeader = request.headers.get("range");

    if (rangeHeader) {
      const range = parseRange(rangeHeader, size);

      if (range && range.kind === "ok") {
        const body = await storage.getRange(key, range.start, range.end);
        return new Response(body, {
          status: 206,
          headers: {
            ...headers,
            "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
            "Content-Length": String(range.end - range.start + 1)
          }
        });
      }

      if (range && range.kind === "unsat") {
        return new Response(null, {
          status: 416,
          headers: {
            ...headers,
            "Content-Range": `bytes */${size}`
          }
        });
      }
    }

    if (size === 0) {
      return new Response(null, { status: 200, headers });
    }

    const body = await storage.getRange(key, 0, size - 1);
    return new Response(body, { status: 200, headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

export async function HEAD(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  const key = segments.join("/");

  try {
    const size = await storage.head(key);
    return new Response(null, {
      status: 200,
      headers: buildHeaders(mimeFromKey(key), size)
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
