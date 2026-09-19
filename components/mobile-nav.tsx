"use client";

import { Menu, Settings, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { href: "/digital-human", label: "数字人" },
  { href: "/posts", label: "文章" },
  { href: "/videos", label: "视频" },
  { href: "/photos", label: "图片" },
  { href: "/about", label: "关于" },
  { href: "/search", label: "搜索" }
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="打开导航"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="font-semibold">导航</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="关闭导航"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>
          <nav className="grid gap-1 px-4 pt-2" aria-label="主导航">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="mt-2 flex items-center gap-2 rounded-lg border-t px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted"
              onClick={() => setOpen(false)}
            >
              <Settings className="size-4" />
              管理后台
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
