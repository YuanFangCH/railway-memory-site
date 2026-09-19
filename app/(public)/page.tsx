import { HeroCarousel } from "@/components/public/hero-carousel";
import { HeroBanner } from "@/components/public/hero-banner";
import { NewsGrid } from "@/components/public/news-grid";
import { RailDivider } from "@/components/public/rail-divider";
import { prisma } from "@/lib/db";
import { buildGuidedTourHeroSlide, GUIDED_TOURS } from "@/lib/tour";
import { buildHeroSlides } from "@/lib/hero";
import { getSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const [
    settings,
    latestPosts,
    latestVideos,
    latestImages,
    categories,
    tags,
    heroPosts,
    heroImages
  ] = await Promise.all([
    getSiteSettings(),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: {
        slug: true,
        title: true,
        summary: true,
        publishedAt: true,
        coverImage: {
          select: {
            asset: { select: { thumbnailUrl: true, publicUrl: true } }
          }
        }
      }
    }),
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        slug: true,
        title: true,
        description: true,
        publishedAt: true,
        posterAsset: { select: { thumbnailUrl: true, publicUrl: true } }
      }
    }),
    prisma.image.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: {
        slug: true,
        title: true,
        description: true,
        publishedAt: true,
        asset: true
      }
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      take: 6,
      select: { slug: true, name: true }
    }),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      take: 12,
      select: { slug: true, name: true }
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: {
        slug: true,
        title: true,
        summary: true,
        publishedAt: true,
        coverImage: {
          select: {
            asset: { select: { thumbnailUrl: true, publicUrl: true } }
          }
        }
      }
    }),
    prisma.image.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: {
        slug: true,
        title: true,
        description: true,
        publishedAt: true,
        asset: { select: { thumbnailUrl: true, publicUrl: true } }
      }
    })
  ]);

  const tourSlide = buildGuidedTourHeroSlide(GUIDED_TOURS[0]);
  const heroSlides = [
    ...(tourSlide ? [tourSlide] : []),
    ...buildHeroSlides(heroPosts, heroImages)
  ];

  return (
    <div className="route-pattern">
      <HeroBanner
        siteName={settings.siteName}
        siteDescription={settings.siteDescription}
      />

      {heroSlides.length ? <HeroCarousel slides={heroSlides} /> : null}

      <RailDivider />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <NewsGrid
          data={{
            posts: latestPosts,
            videos: latestVideos,
            images: latestImages.map((image) => ({
              ...image,
              asset: {
                thumbnailUrl: image.asset?.thumbnailUrl ?? null,
                publicUrl: image.asset?.publicUrl ?? ""
              }
            })),
            categories,
            tags
          }}
        />
      </section>
    </div>
  );
}
