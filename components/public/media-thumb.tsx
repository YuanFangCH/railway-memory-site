import Image from "next/image";

export function MediaThumb({
  src,
  alt,
  title,
  className = ""
}: {
  src?: string | null;
  alt: string;
  title?: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-muted p-6 text-center text-lg font-semibold text-muted-foreground ${className}`}
      >
        {title ? <span className="line-clamp-3">{title}</span> : null}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        unoptimized
        className="object-cover"
      />
    </div>
  );
}
