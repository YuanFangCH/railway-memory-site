import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/utils";

describe("slugify", () => {
  it("converts latin text", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("keeps Chinese characters", () => {
    expect(slugify("第一篇 博客")).toBe("第一篇-博客");
  });

  it("removes edge separators", () => {
    expect(slugify("-- test --")).toBe("test");
  });
});
