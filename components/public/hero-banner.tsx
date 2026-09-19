import Image from "next/image";
import Link from "next/link";

export function HeroBanner({
  siteName,
  siteDescription,
  backgroundImage,
  emblem
}: {
  siteName: string;
  siteDescription: string;
  backgroundImage?: string;
  emblem?: string;
}) {
  return (
    <section
      className="hero-banner relative text-white"
      aria-label="首屏横幅"
      style={
        backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined
      }
    >
      <div className="hero-overlay absolute inset-0" aria-hidden />
      {emblem ? (
        <div className="pointer-events-none absolute right-8 top-1/2 hidden w-44 -translate-y-1/2 lg:block xl:right-14">
          <div className="relative aspect-square w-full">
            <Image
              src={emblem}
              alt=""
              fill
              sizes="176px"
              unoptimized
              className="object-contain opacity-95 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>
      ) : null}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#f0c66a]">
          Railway Memory
        </p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
          {siteName}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          {siteDescription}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/posts"
            className="inline-flex items-center rounded-md bg-[#c8901f] px-5 py-2.5 text-sm font-semibold text-[#0a2745] transition-colors hover:bg-[#d9a52f]"
          >
            探索文章
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            关于项目
          </Link>
        </div>
      </div>
      <div className="relative h-1 w-full bg-[#c8901f]" aria-hidden />
    </section>
  );
}
