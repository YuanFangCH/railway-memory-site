import Link from "next/link";

import { ArrowRight } from "lucide-react";

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel = "查看全部"
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-border pb-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-[#c8901f]" />
          <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
        </div>
        {subtitle ? (
          <p className="mt-1 text-[11px] uppercase text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          {linkLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
