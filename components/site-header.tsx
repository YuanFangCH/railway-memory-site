import { Settings, TrainFront } from "lucide-react";
import Link from "next/link";

import { MobileNav } from "@/components/mobile-nav";
import { DesktopNav } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";

const siteName = process.env.SITE_NAME || "铁路记忆馆";
const siteTagline = "内容、影像与铁路文化";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="hidden bg-[#00325e] text-white sm:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-4 text-xs sm:px-6">
          <p className="truncate text-white/85">{siteTagline}</p>
          <Link
            href="/admin"
            className="inline-flex shrink-0 items-center gap-1.5 text-white/85 transition-colors hover:text-white"
          >
            <Settings className="size-3.5" />
            管理后台
          </Link>
        </div>
      </div>

      <div className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav />
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#0a2745] text-[#f0c66a]">
                <TrainFront className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block max-w-[16rem] truncate text-base font-bold text-foreground sm:text-lg">
                  {siteName}
                </span>
                <span className="hidden text-[11px] text-muted-foreground sm:block">
                  可配置的资料馆与内容平台
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <DesktopNav />
            <ThemeToggle />
          </div>
        </div>
        <div className="rail-divider h-0.5 w-full" />
      </div>
    </header>
  );
}
