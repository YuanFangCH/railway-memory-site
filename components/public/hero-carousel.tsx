"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Route } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { HeroSlide } from "@/lib/hero";

type HeroCarouselProps = {
  slides: HeroSlide[];
  intervalMs?: number;
};

const DEFAULT_INTERVAL = 6000;

type TourWidget = {
  showTourInvite?: (tourId: string) => void;
};

function startTour(tourId: string, fallbackHref: string) {
  const widget = (window as Window & { GuideAgentWidget?: TourWidget })
    .GuideAgentWidget;
  if (widget?.showTourInvite) {
    widget.showTourInvite(tourId);
    return;
  }

  window.location.assign(fallbackHref);
}

export function HeroCarousel({
  slides,
  intervalMs = DEFAULT_INTERVAL
}: HeroCarouselProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;
  const current = Math.min(active, Math.max(0, count - 1));

  const goTo = useCallback(
    (target: number) => {
      if (count <= 1) {
        return;
      }
      setActive(((target % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // 自动轮播；尊重系统减弱动效，并在悬停/聚焦时暂停。
  useEffect(() => {
    if (count <= 1 || paused) {
      return;
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setActive((value) => (value + 1) % count);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [count, paused, intervalMs]);

  if (count === 0) {
    return null;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) {
      return;
    }
    const delta = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        next();
      } else {
        prev();
      }
    }
  };

  return (
    <section
      className="hero-carousel group relative overflow-hidden bg-[#0a2745] text-white"
      aria-label="首页大屏轮播"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative mx-auto h-[26rem] max-w-7xl sm:h-[32rem] lg:h-[36rem]">
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                isActive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
              aria-hidden={!isActive}
            >
              <div className="relative h-full w-full">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="100vw"
                  unoptimized
                  className={`object-cover ${isActive ? "hero-zoom" : ""}`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a2745]/85 via-[#0a2745]/40 to-[#0a2745]/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a2745]/80 via-transparent to-transparent" />

                <div className="absolute inset-0 flex items-end">
                  <div className="w-full px-4 pb-10 sm:px-8 sm:pb-12 lg:px-12 lg:pb-14">
                    <div className="max-w-3xl">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#f0c66a]">
                        <span>{slide.kindLabel}</span>
                        {slide.dateLabel ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-[#f0c66a]/70" />
                            <span>{slide.dateLabel}</span>
                          </>
                        ) : null}
                      </div>
                      <h2 className="font-serif text-3xl font-bold leading-tight drop-shadow-md sm:text-4xl lg:text-5xl">
                        {slide.title}
                      </h2>
                      {slide.summary ? (
                        <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                          {slide.summary}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {slide.tour ? (
                  <>
                    <Link
                      href={slide.tour.fallbackHref}
                      className="absolute inset-0 z-10"
                      aria-label={`查看${slide.kindLabel}：${slide.title}`}
                    />
                    <div className="absolute bottom-7 right-4 z-20 flex flex-wrap justify-end gap-2 sm:right-8 sm:bottom-10 lg:right-12">
                      <Link
                        href="/digital-human"
                        className="inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/10 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:border-white/70 hover:bg-white/20"
                      >
                        数字人同行
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-md border border-[#f0c66a]/70 bg-[#0a2745]/85 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-[#c8901f] hover:text-[#0a2745]"
                        onClick={() =>
                          startTour(
                            slide.tour!.id,
                            slide.tour!.fallbackHref
                          )
                        }
                      >
                        <Route className="size-4" />
                        {slide.tour.ctaLabel}
                      </button>
                    </div>
                  </>
                ) : (
                  <Link
                    href={slide.href}
                    className="absolute inset-0 z-10"
                    aria-label={`查看${slide.kindLabel}：${slide.title}`}
                  />
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          aria-label="上一张"
          onClick={prev}
          disabled={count <= 1}
          className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/25 bg-black/25 p-2 text-white/90 backdrop-blur-sm transition hover:border-[#c8901f] hover:text-[#c8901f] disabled:opacity-40 sm:block"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="下一张"
          onClick={next}
          disabled={count <= 1}
          className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/25 bg-black/25 p-2 text-white/90 backdrop-blur-sm transition hover:border-[#c8901f] hover:text-[#c8901f] disabled:opacity-40 sm:block"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-5 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center gap-2">
          {slides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              aria-label={`第 ${index + 1} 张`}
              aria-current={index === current}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === current
                  ? "w-8 bg-[#c8901f]"
                  : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
