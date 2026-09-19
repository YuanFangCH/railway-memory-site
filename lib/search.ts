import { prisma } from "@/lib/db";

export type SearchResult = {
  id: string;
  type: "post" | "video" | "image";
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: Date | null;
  rank: number;
};

export async function searchContent(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const safeQuery = trimmed.slice(0, 200);
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT type, id, title, excerpt, slug, "publishedAt", rank FROM (
      SELECT
        'post' AS type,
        p.id,
        p.title,
        left(coalesce(p.summary, p.content), 240) AS excerpt,
        p.slug,
        p."publishedAt",
        to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.summary, '') || ' ' || coalesce(p.content, '')) AS doc,
        plainto_tsquery('simple', ${safeQuery}) AS query,
        ts_rank(
          to_tsvector('simple', coalesce(p.title, '') || ' ' || coalesce(p.summary, '') || ' ' || coalesce(p.content, '')),
          plainto_tsquery('simple', ${safeQuery})
        ) AS rank
      FROM "Post" p
      WHERE p.status = 'PUBLISHED'

      UNION ALL

      SELECT
        'video' AS type,
        v.id,
        v.title,
        left(v.description, 240) AS excerpt,
        v.slug,
        v."publishedAt",
        to_tsvector('simple', coalesce(v.title, '') || ' ' || coalesce(v.description, '')) AS doc,
        plainto_tsquery('simple', ${safeQuery}) AS query,
        ts_rank(
          to_tsvector('simple', coalesce(v.title, '') || ' ' || coalesce(v.description, '')),
          plainto_tsquery('simple', ${safeQuery})
        ) AS rank
      FROM "Video" v
      WHERE v.status = 'PUBLISHED'

      UNION ALL

      SELECT
        'image' AS type,
        i.id,
        i.title,
        left(i.description, 240) AS excerpt,
        i.slug,
        i."publishedAt",
        to_tsvector('simple', coalesce(i.title, '') || ' ' || coalesce(i.description, '')) AS doc,
        plainto_tsquery('simple', ${safeQuery}) AS query,
        ts_rank(
          to_tsvector('simple', coalesce(i.title, '') || ' ' || coalesce(i.description, '')),
          plainto_tsquery('simple', ${safeQuery})
        ) AS rank
      FROM "Image" i
      WHERE i.status = 'PUBLISHED'
    ) AS results
    WHERE results.doc @@ results.query
    ORDER BY results.rank DESC
    LIMIT 30
  `;

  return results;
}
