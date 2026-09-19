"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

export function AgentWidget({ baseUrl }: { baseUrl: string }) {
  const router = useRouter();
  const normalized = baseUrl.replace(/\/$/, "");
  const src = `${normalized}/guide-agent/widget.js?v=20260912-2`;
  const apiBase = `${normalized}/api/guide-agent`;
  const assetBase = `${normalized}/guide-agent/assets`;

  useEffect(() => {
    const host = {
      version: 1,
      navigate(url: string) {
        let parsed: URL;
        try {
          parsed = new URL(url, window.location.href);
        } catch {
          return Promise.resolve(false);
        }

        if (parsed.origin !== window.location.origin) {
          window.open(parsed.href, "_blank", "noopener,noreferrer");
          return Promise.resolve(false);
        }

        const target = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (target === current) {
          return Promise.resolve(true);
        }

        router.push(target, { scroll: false });
        return new Promise<boolean>((resolve) => {
          const startedAt = Date.now();
          const timer = window.setInterval(() => {
            const ready =
              window.location.pathname === parsed.pathname &&
              window.location.search === parsed.search &&
              document.readyState !== "loading";
            if (ready || Date.now() - startedAt > 10000) {
              window.clearInterval(timer);
              window.setTimeout(() => resolve(ready), 100);
            }
          }, 120);
        });
      }
    };

    const hostWindow = window as Window & {
      GuideAgentHost?: typeof host;
    };
    hostWindow.GuideAgentHost = host;
    window.dispatchEvent(
      new CustomEvent("guide-agent:host-ready", { detail: { version: 1 } })
    );

    return () => {
      if (hostWindow.GuideAgentHost === host) {
        delete hostWindow.GuideAgentHost;
      }
    };
  }, [router]);

  return (
    <Script
      id="guide-agent-agent-widget"
      src={src}
      strategy="afterInteractive"
      data-agent-base={apiBase}
      data-agent-assets={assetBase}
      data-agent-tour-base="/api/tours"
      data-agent-site={process.env.NEXT_PUBLIC_GUIDE_AGENT_SITE_ID || "default-site"}
    />
  );
}
