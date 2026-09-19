import type { HeroSlide } from "@/lib/hero";

export type GuidedTourImage = {
  src: string;
  alt: string;
  caption: string;
};

export type GuidedTourStop = {
  id: string;
  title: string;
  eyebrow: string;
  narration: string;
  image: GuidedTourImage;
  href: string;
  heading?: string;
  anchor?: string;
  dwellSeconds: number;
  sourceIds: string[];
};

export type GuidedTour = {
  id: string;
  version: string;
  title: string;
  summary: string;
  durationMinutes: number;
  coverImage: string;
  fallbackHref: string;
  invitation: string;
  completion: string;
  stops: GuidedTourStop[];
  extensions: {
    title: string;
    href: string;
  }[];
};

// No production route data is shipped with the open-source project.
export const GUIDED_TOURS: readonly GuidedTour[] = [];

export const EMPTY_GUIDED_TOUR: GuidedTour = {
  id: "overview",
  version: "1",
  title: "主题参观",
  summary: "尚未配置参观路线",
  durationMinutes: 0,
  coverImage: "",
  fallbackHref: "/",
  invitation: "",
  completion: "",
  stops: [],
  extensions: []
};

export function getGuidedTour(id: string): GuidedTour | null {
  return GUIDED_TOURS.find((tour) => tour.id === id) ?? null;
}

export function buildGuidedTourHeroSlide(
  tour?: GuidedTour
): HeroSlide | null {
  if (!tour || tour.stops.length === 0) {
    return null;
  }

  return {
    id: `tour-${tour.id}`,
    title: tour.title,
    summary: tour.summary,
    href: tour.fallbackHref,
    image: tour.coverImage,
    kindLabel: "主题参观",
    dateLabel: `${tour.stops.length} 站`,
    tour: {
      id: tour.id,
      ctaLabel: "开始参观",
      fallbackHref: tour.fallbackHref
    }
  };
}
