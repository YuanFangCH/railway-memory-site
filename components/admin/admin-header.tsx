"use client";

import { ExternalLink, LogOut, PanelLeft } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

const links = [
  { href: "/admin", label: "概览", exact: true },
  { href: "/admin/posts", label: "文章" },
  { href: "/admin/videos", label: "视频" },
  { href: "/admin/photos", label: "图片" },
  { href: "/admin/media", label: "媒体" },
  { href: "/admin/accounts", label: "账号" },
  { href: "/admin/settings", label: "设置" }
];

export function AdminHeader({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const visibleLinks = links.filter(
    (link) => link.href !== "/admin/accounts" || role === "SUPER_ADMIN"
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <PanelLeft className="hidden size-5 shrink-0 text-primary md:block" />
          <Link href="/admin" className="truncate font-semibold">
            内容管理
          </Link>
        </div>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="后台导航">
          {visibleLinks.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);

            return (
              <Button
                key={link.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                size="sm"
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })}
          <Button asChild variant="ghost" size="sm">
            <Link href="/guide-agent/admin" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              网页讲解助手 Agent
            </Link>
          </Button>
        </nav>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="size-4" />
          退出
        </Button>
      </div>
      <div className={cn("border-t lg:hidden")}>
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2"
          aria-label="后台移动导航"
        >
          {visibleLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant={
                (link.exact
                  ? pathname === link.href
                  : pathname.startsWith(link.href))
                  ? "secondary"
                  : "ghost"
              }
              size="sm"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Button asChild variant="ghost" size="sm">
            <Link href="/guide-agent/admin" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
              网页讲解助手 Agent
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
