import { describe, expect, it } from "vitest";

import { mimeFromKey } from "@/lib/media/mime";
import { parseRange } from "@/lib/media/range";
import { publicMediaUrl } from "@/lib/storage";

describe("media helpers", () => {
  it("builds stable public urls", () => {
    expect(publicMediaUrl("images/2026/09/file.jpg")).toBe(
      "/media/images/2026/09/file.jpg"
    );
  });

  it("maps extensions to mime types", () => {
    expect(mimeFromKey("video.webm")).toBe("video/webm");
    expect(mimeFromKey("poster.png")).toBe("image/png");
  });
});

describe("range parsing", () => {
  it("resolves a bounded range", () => {
    expect(parseRange("bytes=100-299", 1000)).toEqual({
      kind: "ok",
      start: 100,
      end: 299
    });
  });

  it("resolves an open-ended range to the end", () => {
    expect(parseRange("bytes=500-", 1000)).toEqual({
      kind: "ok",
      start: 500,
      end: 999
    });
  });

  it("resolves a suffix range", () => {
    expect(parseRange("bytes=-100", 1000)).toEqual({
      kind: "ok",
      start: 900,
      end: 999
    });
  });

  it("clamps an end past the object size", () => {
    expect(parseRange("bytes=0-9999", 1000)).toEqual({
      kind: "ok",
      start: 0,
      end: 999
    });
  });

  it("rejects ranges starting at or past the end", () => {
    expect(parseRange("bytes=1000-", 1000)).toEqual({ kind: "unsat" });
    expect(parseRange("bytes=999-998", 1000)).toEqual({ kind: "unsat" });
  });

  it("ignores a malformed header", () => {
    expect(parseRange("items=0-1", 1000)).toBeNull();
    expect(parseRange("bytes=", 1000)).toBeNull();
    expect(parseRange("bytes=abc-def", 1000)).toBeNull();
  });

  it("rejects ranges against an empty object", () => {
    expect(parseRange("bytes=0-", 0)).toEqual({ kind: "unsat" });
    expect(parseRange("bytes=0-0", 0)).toEqual({ kind: "unsat" });
  });
});
