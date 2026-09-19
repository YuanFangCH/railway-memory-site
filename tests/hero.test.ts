import { describe, expect, it } from "vitest";

import { buildHeroSlides } from "@/lib/hero";

const post = (overrides: Partial<Parameters<typeof buildHeroSlides>[0][number]> = {}) => ({
  slug: "post-a",
  title: "一篇推文",
  summary: "这是摘要。",
  publishedAt: new Date("2026-09-01T12:00:00Z"),
  coverImage: {
    asset: { thumbnailUrl: "/media/cover.jpg", publicUrl: "/media/cover.jpg" }
  },
  ...overrides
});

const image = (overrides: Partial<Parameters<typeof buildHeroSlides>[1][number]> = {}) => ({
  slug: "image-a",
  title: "一张图",
  description: "这是图片说明。",
  publishedAt: new Date("2026-09-02T12:00:00Z"),
  asset: { thumbnailUrl: "/media/photo.jpg", publicUrl: "/media/photo.jpg" },
  ...overrides
});

describe("buildHeroSlides", () => {
  it("mixes posts and images sorted by publishedAt descending", () => {
    const slides = buildHeroSlides(
      [
        post({ slug: "older-post", publishedAt: new Date("2026-08-01T12:00:00Z") }),
        post({ slug: "newer-post", publishedAt: new Date("2026-09-05T12:00:00Z") })
      ],
      [
        image({ slug: "mid-image", publishedAt: new Date("2026-09-03T12:00:00Z") })
      ]
    );

    expect(slides.map((slide) => slide.id)).toEqual([
      "post-newer-post",
      "image-mid-image",
      "post-older-post"
    ]);
  });

  it("links posts to detail and labels them as pushes", () => {
    const slides = buildHeroSlides([post({ slug: "my-post" })], []);
    expect(slides[0]).toMatchObject({
      href: "/posts/my-post",
      kindLabel: "推文",
      title: "一篇推文",
      summary: "这是摘要。",
      dateLabel: "09/01"
    });
  });

  it("links images to photos and labels them as images", () => {
    const slides = buildHeroSlides([], [image({ slug: "my-image" })]);
    expect(slides[0]).toMatchObject({
      href: "/photos/my-image",
      kindLabel: "影像",
      title: "一张图",
      summary: "这是图片说明。",
      dateLabel: "09/02"
    });
  });

  it("falls back to a default image when a post has no cover", () => {
    const slides = buildHeroSlides(
      [post({ coverImage: null })],
      []
    );
    expect(slides[0].image).toBe("/placeholder.svg");
  });

  it("falls back when asset urls are missing", () => {
    const slides = buildHeroSlides(
      [],
      [
        image({
          asset: { thumbnailUrl: null, publicUrl: "" }
        })
      ]
    );
    expect(slides[0].image).toBe("/placeholder.svg");
  });
});
