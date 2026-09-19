"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/digital-human", label: "数字人" },
  { href: "/posts", label: "文章" },
  { href: "/videos", label: "视频" },
  { href: "/photos", label: "图库" },
  { href: "/about", label: "关于" },
  { href: "/search", label: "搜索" }
];

export function DesktopNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="主导航">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
            isActive(link.href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
