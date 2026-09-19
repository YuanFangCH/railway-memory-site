import Link from "next/link";

import { MediaThumb } from "@/components/public/media-thumb";

type PhotoCardData = {
  slug: string;
  title: string;
  description: string;
  album: string | null;
  asset: {
    thumbnailUrl: string | null;
    publicUrl: string;
  };
};

export function PhotoCard({ image }: { image: PhotoCardData }) {
  const src = image.asset.thumbnailUrl || image.asset.publicUrl;

  return (
    <Link
      href={`/photos/${image.slug}`}
      className="group relative block overflow-hidden rounded-lg border bg-card text-card-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <MediaThumb
        src={src}
        alt={image.title}
        title={image.title}
        className="aspect-square w-full"
      />
      <div className="photo-veil absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        <p className="truncate text-sm font-medium text-white">{image.title}</p>
        {image.album ? (
          <p className="truncate text-xs text-white/75">{image.album}</p>
        ) : null}
      </div>
      <span className="absolute inset-x-0 top-0 h-0.5 bg-[#c8901f] opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
