import { Bot, ImageIcon, Info, Newspaper, Video } from "lucide-react";
import Link from "next/link";

import { RailDivider } from "@/components/public/rail-divider";
import { SignalIcon } from "@/components/public/signal-icon";

const siteName = process.env.SITE_NAME || "铁路记忆馆";

const navLinks = [
  { href: "/digital-human", label: "数字人" },
  { href: "/posts", label: "文章" },
  { href: "/videos", label: "视频" },
  { href: "/photos", label: "图库" },
  { href: "/search", label: "搜索" }
];

const themes = ["文章", "图片", "视频", "主题内容"];

const quickLinks = [
  { href: "/digital-human", label: "数字人", icon: Bot },
  { href: "/posts", label: "文章", icon: Newspaper },
  { href: "/videos", label: "影像", icon: Video },
  { href: "/photos", label: "图库", icon: ImageIcon },
  { href: "/about", label: "关于", icon: Info }
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0a2745] text-white">
      <RailDivider className="opacity-70" />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="text-lg font-bold">{siteName}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              一个面向铁路文化内容的开源网站，支持文章、图片、视频、检索和可选的网页讲解
              Agent。
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">内容导航</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">寻迹主题</h3>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {themes.map((theme) => (
                <li key={theme} className="flex items-center gap-2">
                  <SignalIcon className="size-3.5 text-[#f0c66a]" />
                  {theme}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3 border-t border-white/15 pt-6">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 transition-colors hover:border-[#c8901f] hover:text-white"
            >
              <link.icon className="size-4 text-[#f0c66a]" />
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3">
            <span className="shrink-0 text-[#f0c66a]">
              <svg
                viewBox="0 0 64 32"
                fill="currentColor"
                className="size-8"
                aria-hidden
              >
                <path d="M3 21h38l4 5H3z" />
                <rect x="7" y="11" width="30" height="10" rx="2" />
                <rect x="35" y="7" width="11" height="14" rx="1.6" />
                <path d="M39 7l2.4-5.5h3.2L47 7z" />
                <circle cx="14" cy="26" r="3.4" />
                <circle cx="28" cy="26" r="3.4" />
                <circle cx="42" cy="26" r="3.4" />
                <path d="M46 20l10 7H46z" />
              </svg>
            </span>
            © {new Date().getFullYear()} {siteName}
          </p>
          <Link href="/admin" className="transition-colors hover:text-white">
            管理后台
          </Link>
        </div>
      </div>
    </footer>
  );
}
