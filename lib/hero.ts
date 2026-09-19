export type HeroSlide = {
  id: string;
  title: string;
  summary: string;
  href: string;
  image: string;
  kindLabel: string;
  dateLabel: string;
  tour?: {
    id: string;
    ctaLabel: string;
    fallbackHref: string;
  };
};

type HeroPostInput = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: Date | null;
  coverImage?: {
    asset?: { thumbnailUrl?: string | null; publicUrl?: string | null } | null;
  } | null;
};

type HeroImageInput = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date | null;
  asset?: { thumbnailUrl?: string | null; publicUrl?: string | null } | null;
};

const FALLBACK_IMAGE = "/placeholder.svg";

function resolveImage(candidates: readonly (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    if (candidate) {
      return candidate;
    }
  }
  return FALLBACK_IMAGE;
}

function dateLabel(date: Date | null | undefined): string {
  if (!date) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

/**
 * 把站内已发布推文与图片归一化为首页大屏轮播幻灯片。
 *
 * 推文缺封面、图片缺素材地址时都会回退到默认图，因此不会出现破图；
 * 两种来源按发布时间倒序混合，无发布的放在最后。
 */
export function buildHeroSlides(
  posts: HeroPostInput[],
  images: HeroImageInput[]
): HeroSlide[] {
  const withSort: { slide: HeroSlide; publishedAtMs: number }[] = [
    ...posts.map((post) => ({
      slide: {
        id: `post-${post.slug}`,
        title: post.title,
        summary: post.summary,
        href: `/posts/${post.slug}`,
        image: resolveImage([
          post.coverImage?.asset?.thumbnailUrl,
          post.coverImage?.asset?.publicUrl
        ]),
        kindLabel: "推文",
        dateLabel: dateLabel(post.publishedAt)
      },
      publishedAtMs: post.publishedAt?.getTime() ?? 0
    })),
    ...images.map((image) => ({
      slide: {
        id: `image-${image.slug}`,
        title: image.title,
        summary: image.description,
        href: `/photos/${image.slug}`,
        image: resolveImage([image.asset?.thumbnailUrl, image.asset?.publicUrl]),
        kindLabel: "影像",
        dateLabel: dateLabel(image.publishedAt)
      },
      publishedAtMs: image.publishedAt?.getTime() ?? 0
    }))
  ];

  return withSort
    .sort((a, b) => b.publishedAtMs - a.publishedAtMs)
    .map((entry) => entry.slide);
}
