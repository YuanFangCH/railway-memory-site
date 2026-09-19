import { Film, ImageIcon, Newspaper, Tags } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type NewsColumnProps = {
  title: string;
  subtitle: string;
  icon: typeof Newspaper;
  href: string;
  children: React.ReactNode;
};

function NewsColumn({
  title,
  subtitle,
  icon: Icon,
  href,
  children
}: NewsColumnProps) {
  return (
    <div className="news-col rounded-lg border bg-card p-4 text-card-foreground">
      <Link href={href} className="group flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-[#005bac] text-white">
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold group-hover:text-primary">
              {title}
            </h2>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      </Link>
      <div className="mt-3 h-0.5 w-full bg-gradient-to-r from-[#c8901f] to-transparent" />
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function EmptySlot({
  image,
  label
}: {
  image: string;
  label: string;
}) {
  return (
    <div className="ghost-slot relative overflow-hidden rounded-md border">
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        unoptimized
        className="object-cover opacity-40"
      />
      <div className="absolute inset-0 grid place-items-center bg-white/55 text-center dark:bg-black/45">
        <span className="text-sm font-medium text-foreground/75">{label}</span>
      </div>
    </div>
  );
}

function shortDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

type NewsGridData = {
  posts: {
    slug: string;
    title: string;
    summary: string;
    publishedAt: Date | null;
    coverImage: {
      asset: { thumbnailUrl: string | null; publicUrl: string };
    } | null;
  }[];
  videos: {
    slug: string;
    title: string;
    description: string;
    publishedAt: Date | null;
    posterAsset: { thumbnailUrl: string | null; publicUrl: string } | null;
  }[];
  images: {
    slug: string;
    title: string;
    description: string;
    publishedAt: Date | null;
    asset: { thumbnailUrl: string | null; publicUrl: string };
  }[];
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
};

export function NewsGrid({ data }: { data: NewsGridData }) {
  const { posts, videos, images, categories, tags } = data;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <NewsColumn
        title="团队头条"
        subtitle="Top News"
        icon={Newspaper}
        href="/posts"
      >
        {posts.length ? (
          posts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group flex items-start gap-3"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border">
                <Image
                  src={
                    post.coverImage?.asset?.thumbnailUrl ||
                    post.coverImage?.asset?.publicUrl ||
                    "/placeholder.svg"
                  }
                  alt=""
                  fill
                  sizes="56px"
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-sm bg-[#0a2745] px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#f0c66a]">
                  {shortDate(post.publishedAt)}
                </span>
                <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {post.summary}
                </p>
                <p className="mt-1 text-[11px] font-medium text-primary">
                  原文
                </p>
              </div>
            </Link>
          ))
        ) : (
          <EmptySlot
            image="/placeholder.svg"
            label="文章筹备中"
          />
        )}
      </NewsColumn>

      <NewsColumn
        title="影像记录"
        subtitle="Films"
        icon={Film}
        href="/videos"
      >
        {videos.length ? (
          videos.map((video) => (
            <Link
              key={video.slug}
              href={`/videos/${video.slug}`}
              className="group flex items-start gap-3"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border">
                <Image
                  src={
                    video.posterAsset?.thumbnailUrl ||
                    video.posterAsset?.publicUrl ||
                    "/placeholder.svg"
                  }
                  alt=""
                  fill
                  sizes="56px"
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-sm bg-[#0a2745] px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#f0c66a]">
                  {shortDate(video.publishedAt)}
                </span>
                <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                  {video.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {video.description}
                </p>
                <p className="mt-1 text-[11px] font-medium text-primary">原文</p>
              </div>
            </Link>
        ))
        ) : (
          <EmptySlot image="/placeholder.svg" label="影像筹备中" />
        )}
      </NewsColumn>

      <NewsColumn
        title="光影图库"
        subtitle="Gallery"
        icon={ImageIcon}
        href="/photos"
      >
        {images.length ? (
          images.map((image) => (
            <Link
              key={image.slug}
              href={`/photos/${image.slug}`}
              className="group flex items-center gap-3"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md border">
                <Image
                  src={image.asset.thumbnailUrl || image.asset.publicUrl}
                  alt={image.title}
                  fill
                  sizes="56px"
                  unoptimized
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">
                  {image.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {shortDate(image.publishedAt)}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <EmptySlot
            image="/placeholder.svg"
            label="图库筹备中"
          />
        )}
      </NewsColumn>

      <NewsColumn
        title="寻迹索引"
        subtitle="Index"
        icon={Tags}
        href="/search"
      >
        {categories.length || tags.length ? (
          <div className="space-y-3">
            {categories.length ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    className="rounded-md border bg-muted/50 px-2.5 py-1 text-xs font-medium hover:border-primary hover:text-primary"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}
            {tags.length ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    key={tag.slug}
                    href={`/tags/${tag.slug}`}
                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <EmptySlot image="/placeholder.svg" label="索引整理中" />
        )}
      </NewsColumn>
    </div>
  );
}
