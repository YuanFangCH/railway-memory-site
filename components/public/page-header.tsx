import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-border pb-6">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase text-[#c8901f]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 text-3xl font-bold">{title}</h1>
      {description ? (
        <p className="mt-2 text-muted-foreground">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
