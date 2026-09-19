import { describe, expect, it } from "vitest";

import {
  buildDigitalHumanTourContext,
  buildTourHandoff,
  isSafeAgentHref,
  parseSseBlock,
  takeSpeechChunks
} from "@/lib/digital-human";
import type { GuidedTour } from "@/lib/tour";

const tour: GuidedTour = {
  id: "overview",
  version: "1",
  title: "Overview",
  summary: "Short route",
  durationMinutes: 5,
  coverImage: "/placeholder.svg",
  fallbackHref: "/",
  invitation: "",
  completion: "",
  extensions: [],
  stops: [0, 1, 2, 3, 4, 5].map((index) => ({
    id: `stop-${index}`,
    title: `Stop ${index}`,
    eyebrow: `Step ${index}`,
    narration: "Example narration.",
    image: { src: "/placeholder.svg", alt: "Placeholder", caption: "" },
    href: "/",
    dwellSeconds: 30,
    sourceIds: []
  }))
};

describe("digital human tour bridge", () => {
  it("builds the tour context expected by the guide agent", () => {
    const context = buildDigitalHumanTourContext(tour, 3, "window", false);

    expect(context.id).toBe(tour.id);
    expect(context.stepIndex).toBe(3);
    expect(context.stepCount).toBe(6);
    expect(context.currentStep?.title).toBe(tour.stops[3].title);
    expect(context.previousStep).toBe(tour.stops[2].title);
    expect(context.nextStep).toBe(tour.stops[4].title);
  });

  it("uses the existing widget handoff storage shape", () => {
    expect(buildTourHandoff("overview", 5, false)).toEqual({
      routeId: "overview",
      mode: "page",
      index: 5,
      paused: false
    });
  });
});

describe("digital human streaming helpers", () => {
  it("parses SSE events and malformed data safely", () => {
    expect(parseSseBlock('event: token\ndata: {"text":"hello"}')).toEqual({
      event: "token",
      data: { text: "hello" }
    });
    expect(parseSseBlock("event: token\ndata: plain text")).toEqual({
      event: "token",
      data: { text: "plain text" }
    });
  });

  it("only releases complete speech sentences", () => {
    const first = takeSpeechChunks("这是第一句。它先后经历");
    expect(first.chunks).toEqual(["这是第一句。"]);
    expect(first.rest).toBe("它先后经历");

    const final = takeSpeechChunks(first.rest, true);
    expect(final.chunks).toEqual(["它先后经历"]);
    expect(final.rest).toBe("");
  });

  it("allows same-site and HTTPS links only", () => {
    expect(isSafeAgentHref("/posts/example")).toBe(true);
    expect(isSafeAgentHref("https://example.com/posts")).toBe(true);
    expect(isSafeAgentHref("javascript:alert(1)")).toBe(false);
    expect(isSafeAgentHref("//evil.example")).toBe(false);
  });
});
