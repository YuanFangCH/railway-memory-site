import Link from "next/link";

import { MediaThumb } from "@/components/public/media-thumb";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date";

type PostCardData = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: Date | null;
  category: { slug: string; name: string } | null;
  tags: { slug: string; name: string }[];
  coverImage: {
    asset: { thumbnailUrl: string | null; publicUrl: string };
  } | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  const image = post.coverImage?.asset.thumbnailUrl || post.coverImage?.asset.publicUrl;

  return (
    <article className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <Link href={`/posts/${post.slug}`} className="flex h-full flex-col">
        <div className="relative">
          <MediaThumb
            src={image}
            alt={post.title}
            title={post.title}
            className="aspect-video w-full"
          />
          {post.category ? (
            <span className="absolute left-3 top-3 rounded-sm bg-[#005bac] px-2 py-0.5 text-xs font-medium text-white">
              {post.category.name}
            </span>
          ) : null}
        </div>
        <div className="grid flex-1 content-start gap-3 p-4">
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug group-hover:text-primary">
            {post.title}
          </h2>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {post.summary}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt ? formatDate(post.publishedAt) : ""}
            </time>
            {post.tags.length ? (
              <Badge variant="secondary">{post.tags[0].name}</Badge>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}
