export type RangeResult =
  | { kind: "ok"; start: number; end: number }
  | { kind: "unsat" }
  | null;

export function parseRange(header: string, size: number): RangeResult {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, startStr, endStr] = match;

  if (startStr === "" && endStr === "") return null;

  if (startStr === "") {
    const length = Number(endStr);
    if (!Number.isFinite(length) || length <= 0) return null;
    if (size === 0) return { kind: "unsat" };
    const start = Math.max(size - length, 0);
    return { kind: "ok", start, end: size - 1 };
  }

  const start = Number(startStr);
  if (!Number.isFinite(start) || start < 0) return null;

  if (size === 0) return { kind: "unsat" };

  let end = endStr === "" ? size - 1 : Number(endStr);
  if (!Number.isFinite(end)) return null;
  if (end >= size) end = size - 1;

  if (start >= size || end < start) return { kind: "unsat" };
  return { kind: "ok", start, end };
}
