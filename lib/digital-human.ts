import type { GuidedTour } from "@/lib/tour";

export type DigitalHumanPageSection = {
  anchor: string;
  selector: string;
  heading: string;
  text: string;
};

export type DigitalHumanPageContext = {
  pageKey: string;
  contentHash: string;
  url: string;
  title: string;
  text: string;
  sections: DigitalHumanPageSection[];
  currentAnchor: string;
};

export type DigitalHumanTourContext = {
  id: string;
  title: string;
  stepIndex: number;
  stepCount: number;
  mode: "window" | "page";
  paused: boolean;
  currentStep: {
    id: string;
    title: string;
    eyebrow: string;
    narration: string;
    href: string;
    heading: string;
  } | null;
  previousStep: string | null;
  nextStep: string | null;
};

export type ParsedSseEvent = {
  event: string;
  data: Record<string, unknown>;
};

export type TourHandoff = {
  routeId: string;
  mode: "page";
  index: number;
  paused: boolean;
};

export function hashText(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(16);
}

export function buildDigitalHumanPageContext(
  currentAnchor = ""
): DigitalHumanPageContext {
  const url =
    typeof window === "undefined" ? "/digital-human" : window.location.href;
  const sections = [
    {
      anchor: "dh-intro",
      selector: "#dh-intro",
      heading: "网页讲解助手数字人",
      text: "数字人页面提供文字对话、浏览器朗读和可配置的主题参观。"
    },
    {
      anchor: "dh-chat",
      selector: "#dh-chat",
      heading: "与网页讲解助手对话",
      text: "可以询问站内内容、网站使用方式或部署者配置的主题资料。"
    },
    {
      anchor: "dh-tour",
      selector: "#dh-tour",
      heading: "主题参观",
      text: "配置访问路线后，可以在本页参观，也可以交接给网站右下角的网页讲解助手。"
    }
  ];
  const contentHash = hashText(
    sections.map((section) => `${section.anchor}${section.heading}${section.text}`).join("")
  );

  return {
    pageKey: "digital-human-v1",
    contentHash,
    url,
    title: "网页讲解助手数字人",
    text: sections.map((section) => `${section.heading}\n${section.text}`).join("\n\n"),
    sections,
    currentAnchor
  };
}

export function buildDigitalHumanTourContext(
  tour: GuidedTour,
  stepIndex: number,
  mode: "window" | "page",
  paused: boolean
): DigitalHumanTourContext {
  const safeIndex = Math.max(0, Math.min(stepIndex, tour.stops.length - 1));
  const stop = tour.stops[safeIndex] ?? null;
  return {
    id: tour.id,
    title: tour.title,
    stepIndex: safeIndex,
    stepCount: tour.stops.length,
    mode,
    paused,
    currentStep: stop
      ? {
          id: stop.id,
          title: stop.title,
          eyebrow: stop.eyebrow,
          narration: stop.narration,
          href: stop.href,
          heading: stop.heading ?? ""
        }
      : null,
    previousStep: tour.stops[safeIndex - 1]?.title ?? null,
    nextStep: tour.stops[safeIndex + 1]?.title ?? null
  };
}

export function buildTourHandoff(
  routeId: string,
  index: number,
  paused = true
): TourHandoff {
  return {
    routeId,
    mode: "page",
    index: Math.max(0, Math.floor(index)),
    paused
  };
}

export function parseSseBlock(block: string): ParsedSseEvent {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  const raw = dataLines.join("\n");
  try {
    return {
      event,
      data: raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
    };
  } catch {
    return { event, data: { text: raw } };
  }
}

export function takeSpeechChunks(
  buffer: string,
  flush = false
): { chunks: string[]; rest: string } {
  const chunks: string[] = [];
  let rest = buffer.trimStart();
  const boundary = /[。！？!?；;\n]+/;
  let match = boundary.exec(rest);

  while (match) {
    const end = (match.index ?? 0) + match[0].length;
    const chunk = rest.slice(0, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    rest = rest.slice(end).trimStart();
    match = boundary.exec(rest);
  }

  if (flush && rest.trim()) {
    chunks.push(rest.trim());
    rest = "";
  }

  return { chunks, rest };
}

export function isSafeAgentHref(value: string): boolean {
  if (!value) {
    return false;
  }
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
