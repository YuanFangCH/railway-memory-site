import { describe, expect, it } from "vitest";

import { postSchema } from "@/lib/validators/content";

describe("content validators", () => {
  it("accepts a valid post payload", () => {
    const result = postSchema.safeParse({
      title: "First post",
      slug: "first-post",
      summary: "A short summary",
      content: "<p>Hello</p>",
      status: "PUBLISHED",
      tagNames: ["blog"]
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing content", () => {
    const result = postSchema.safeParse({
      title: "First post",
      summary: "A short summary",
      content: "",
      status: "DRAFT",
      tagNames: []
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = postSchema.safeParse({
      title: "First post",
      summary: "A short summary",
      content: "<p>Hello</p>",
      status: "VISIBLE",
      tagNames: []
    });

    expect(result.success).toBe(false);
  });
});
