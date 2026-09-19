import { describe, expect, it } from "vitest";

import {
  buildGuidedTourHeroSlide,
  EMPTY_GUIDED_TOUR,
  getGuidedTour,
  GUIDED_TOURS
} from "@/lib/tour";

describe("guided tours", () => {
  it("ships without production route data", () => {
    expect(GUIDED_TOURS).toHaveLength(0);
    expect(EMPTY_GUIDED_TOUR.stops).toHaveLength(0);
  });

  it("returns null for unknown and empty routes", () => {
    expect(getGuidedTour("missing")).toBeNull();
    expect(buildGuidedTourHeroSlide(EMPTY_GUIDED_TOUR)).toBeNull();
    expect(buildGuidedTourHeroSlide()).toBeNull();
  });
});
