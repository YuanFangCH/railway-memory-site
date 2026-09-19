import { NextResponse } from "next/server";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJson<T>(request: Request): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }
> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      response: apiError("请求体不是有效的 JSON", 400)
    };
  }
}
