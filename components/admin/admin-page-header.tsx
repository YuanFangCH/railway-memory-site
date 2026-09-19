import { Plus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AdminPageHeader({
  title,
  description,
  href,
  actionLabel
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {href && actionLabel ? (
        <Button asChild>
          <Link href={href}>
            <Plus className="size-4" />
            {actionLabel}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
