import { Play } from "lucide-react";
import Link from "next/link";

import { MediaThumb } from "@/components/public/media-thumb";
import { formatDate } from "@/lib/date";

type VideoCardData = {
  slug: string;
  title: string;
  description: string;
  publishedAt: Date | null;
  category: { slug: string; name: string } | null;
  posterAsset: {
    thumbnailUrl: string | null;
    publicUrl: string;
  } | null;
};

export function VideoCard({ video }: { video: VideoCardData }) {
  const image =
    video.posterAsset?.thumbnailUrl || video.posterAsset?.publicUrl || null;

  return (
    <article className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <Link href={`/videos/${video.slug}`} className="flex h-full flex-col">
        <div className="relative">
          <MediaThumb
            src={image}
            alt={video.title}
            title={video.title}
            className="aspect-video w-full"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/10">
            <span className="grid size-12 place-items-center rounded-full bg-background/90 text-[#005bac] shadow-sm transition-transform group-hover:scale-105">
              <Play className="ml-0.5 size-5 fill-current" />
            </span>
          </span>
          {video.category ? (
            <span className="absolute left-3 top-3 rounded-sm bg-[#005bac] px-2 py-0.5 text-xs font-medium text-white">
              {video.category.name}
            </span>
          ) : null}
        </div>
        <div className="grid flex-1 content-start gap-2 p-4">
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary">
            {video.title}
          </h2>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {video.description}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <time dateTime={video.publishedAt?.toISOString()}>
              {video.publishedAt ? formatDate(video.publishedAt) : ""}
            </time>
          </div>
        </div>
      </Link>
    </article>
  );
}
