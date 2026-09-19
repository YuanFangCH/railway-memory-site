import type { Metadata } from "next";

import { DigitalHumanExperience } from "@/components/digital-human/digital-human-experience";
import { EMPTY_GUIDED_TOUR, GUIDED_TOURS } from "@/lib/tour";

export const metadata: Metadata = {
  title: "网页讲解助手数字人",
  description:
    "网页讲解助手数字人提供文字对话、浏览器朗读和可配置的主题参观。",
  alternates: {
    canonical: "/digital-human"
  }
};

export default function DigitalHumanPage() {
  const tour = GUIDED_TOURS[0] ?? EMPTY_GUIDED_TOUR;
  const base = (process.env.GUIDE_AGENT_PUBLIC_BASE_URL || "").replace(
    /\/$/,
    ""
  );

  return (
    <DigitalHumanExperience tour={tour} apiBase={`${base}/api/guide-agent`} />
  );
}
