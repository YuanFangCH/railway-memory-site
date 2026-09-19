import { createHash, timingSafeEqual } from "node:crypto";

import { load } from "cheerio";

import { prisma } from "@/lib/db";
import { GUIDED_TOURS } from "@/lib/tour";

export type AgentExportItemType =
  | "post"
  | "image"
  | "video"
  | "page"
  | "document"
  | "team-note";

export type AgentExportSection = {
  anchor: string;
  heading: string;
  text: string;
};

export type AgentExportItem = {
  source: "website";
  sourceId: string;
  type: AgentExportItemType;
  title: string;
  url: string;
  contentHtml: string;
  contentText: string;
  sections: AgentExportSection[];
  metadata: Record<string, unknown>;
  checksum: string;
  updatedAt: string;
};

export type AgentExportCursor = {
  updatedAt: string;
  sourceId: string;
};

export class InvalidAgentCursorError extends Error {
  constructor() {
    super("Invalid agent export cursor");
    this.name = "InvalidAgentCursorError";
  }
}

const ABOUT_PAGE_HTML = `
  <h2>关于项目</h2>
  <p>铁路记忆馆是一个面向铁路文化内容的开源网站，支持文章、图片、视频、全文检索和可选的网页讲解 Agent。</p>
  <h2>内容能力</h2>
  <p>部署者可以通过后台维护文章、图片、视频、分类、标签和站点设置，所有生产内容均由部署者自行录入。</p>
  <h2>Agent 联动</h2>
  <p>网站可以向独立部署的网页讲解 Agent 导出已发布内容，并通过短时授权支持受控的内容草稿或发布操作。</p>
`;

export function normalizeAgentText(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textWithBreaks($: ReturnType<typeof load>, root: unknown) {
  const blockText = $(root as never)
    .find("h1, h2, h3, p, li, blockquote, pre, tr")
    .toArray()
    .map((element) => $(element).text())
    .filter(Boolean)
    .join("\n");

  return normalizeAgentText(blockText || $(root as never).text());
}

export function stripAgentHtml(html: string) {
  const $ = load(html);
  $("script, style, noscript, svg").remove();
  return textWithBreaks($, $.root());
}

function sectionHeading($: ReturnType<typeof load>, element: unknown) {
  const current = $(element as never);
  const explicit = current.attr("data-agent-title")?.trim();
  if (explicit) {
    return explicit;
  }

  const heading = current.find("h1, h2, h3").first().text().trim();
  return heading || current.attr("aria-label")?.trim() || "";
}

function splitTextFallback(text: string, maxLength = 900) {
  const normalized = normalizeAgentText(text);
  if (!normalized) {
    return [] as AgentExportSection[];
  }

  const blocks = normalized
    .split(/\n{2,}|(?<=[。！？!?])\s+/)
    .map((block) => block.trim())
    .filter(Boolean);

  const sections: AgentExportSection[] = [];
  let buffer = "";

  for (const block of blocks.length ? blocks : [normalized]) {
    if (block.length > maxLength) {
      for (let start = 0; start < block.length; start += maxLength) {
        sections.push({
          anchor: `section-${sections.length + 1}`,
          heading: "",
          text: block.slice(start, start + maxLength)
        });
      }
      buffer = "";
      continue;
    }

    if (buffer && buffer.length + block.length + 1 > maxLength) {
      sections.push({
        anchor: `section-${sections.length + 1}`,
        heading: "",
        text: buffer
      });
      buffer = block;
    } else {
      buffer = buffer ? `${buffer}\n${block}` : block;
    }
  }

  if (buffer) {
    sections.push({
      anchor: `section-${sections.length + 1}`,
      heading: "",
      text: buffer
    });
  }

  return sections;
}

export function extractAgentSections(html: string) {
  const $ = load(html);
  $("script, style, noscript, svg").remove();

  const explicit = $("[data-agent-section]").toArray();
  if (explicit.length) {
    return explicit
      .map((element, index) => ({
        anchor:
          $(element).attr("data-agent-section")?.trim() || `section-${index + 1}`,
        heading: sectionHeading($, element),
        text: textWithBreaks($, element)
      }))
      .filter((section) => section.text);
  }

  const headings = $("h1, h2, h3").toArray();
  if (headings.length) {
    return headings
      .map((heading, index) => {
        const current = $(heading);
        const following = current.nextUntil("h1, h2, h3").toArray();
        const text = normalizeAgentText(
          following.map((element) => textWithBreaks($, element)).join("\n")
        );

        return {
          anchor: current.attr("id")?.trim() || `section-${index + 1}`,
          heading: normalizeAgentText(current.text()),
          text
        };
      })
      .filter((section) => section.heading || section.text);
  }

  const containers = $("section, article").toArray();
  if (containers.length > 1) {
    return containers
      .map((element, index) => ({
        anchor: $(element).attr("id")?.trim() || `section-${index + 1}`,
        heading: sectionHeading($, element),
        text: textWithBreaks($, element)
      }))
      .filter((section) => section.text);
  }

  return splitTextFallback($.root().text());
}

function checksumFor(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function absoluteSiteUrl(siteUrl: string, pathname: string) {
  if (!siteUrl) {
    return pathname;
  }

  try {
    return new URL(pathname, siteUrl).toString();
  } catch {
    return pathname;
  }
}

function pageItem(
  sourceId: string,
  title: string,
  pathname: string,
  html: string,
  updatedAt: Date,
  metadata: Record<string, unknown>,
  siteUrl: string
): AgentExportItem {
  const contentText = stripAgentHtml(html);
  const sections = extractAgentSections(html);

  return {
    source: "website",
    sourceId,
    type: "page",
    title,
    url: absoluteSiteUrl(siteUrl, pathname),
    contentHtml: html,
    contentText,
    sections,
    metadata,
    checksum: checksumFor({ title, contentText, sections, metadata }),
    updatedAt: updatedAt.toISOString()
  };
}

export function encodeAgentCursor(cursor: AgentExportCursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeAgentCursor(value?: string | null): AgentExportCursor | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Partial<AgentExportCursor>;

    if (
      typeof parsed.updatedAt !== "string" ||
      typeof parsed.sourceId !== "string" ||
      Number.isNaN(Date.parse(parsed.updatedAt))
    ) {
      throw new InvalidAgentCursorError();
    }

    return {
      updatedAt: new Date(parsed.updatedAt).toISOString(),
      sourceId: parsed.sourceId
    };
  } catch (error) {
    if (error instanceof InvalidAgentCursorError) {
      throw error;
    }

    throw new InvalidAgentCursorError();
  }
}

export function isAgentExportAuthorized(request: Request) {
  const expected = process.env.GUIDE_AGENT_EXPORT_TOKEN?.trim();
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!expected || !token) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);

  return (
    expectedBuffer.length === tokenBuffer.length &&
    timingSafeEqual(expectedBuffer, tokenBuffer)
  );
}

export async function buildAgentExport({
  cursor,
  limit,
  mode
}: {
  cursor?: string | null;
  limit: number;
  mode: "incremental" | "manifest";
}) {
  const [posts, images, videos, settings] = await Promise.all([
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      include: {
        category: true,
        tags: true,
        coverImage: { include: { asset: true } }
      }
    }),
    prisma.image.findMany({
      where: { status: "PUBLISHED" },
      include: { asset: true }
    }),
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      include: {
        category: true,
        tags: true,
        videoAsset: true,
        posterAsset: true
      }
    }),
    prisma.siteSetting.findUnique({ where: { id: 1 } })
  ]);

  const siteUrl = settings?.siteUrl || process.env.SITE_URL || "";
  const items: AgentExportItem[] = [];

  for (const post of posts) {
    const contentText = stripAgentHtml(post.content);
    const sections = extractAgentSections(post.content);
    const metadata = {
      slug: post.slug,
      summary: post.summary,
      category: post.category?.name || null,
      categorySlug: post.category?.slug || null,
      tags: post.tags.map((tag) => tag.name),
      publishedAt: post.publishedAt?.toISOString() || null,
      coverImage: post.coverImage?.asset.publicUrl || null
    };

    items.push({
      source: "website",
      sourceId: post.id,
      type: "post",
      title: post.title,
      url: absoluteSiteUrl(siteUrl, `/posts/${post.slug}`),
      contentHtml: post.content,
      contentText,
      sections,
      metadata,
      checksum: checksumFor({
        title: post.title,
        contentText,
        sections,
        metadata
      }),
      updatedAt: post.updatedAt.toISOString()
    });
  }

  for (const image of images) {
    const contentText = normalizeAgentText(image.description);
    const metadata = {
      slug: image.slug,
      album: image.album || null,
      imageUrl: image.asset.publicUrl,
      thumbnailUrl: image.asset.thumbnailUrl || null,
      publishedAt: image.publishedAt?.toISOString() || null
    };

    items.push({
      source: "website",
      sourceId: image.id,
      type: "image",
      title: image.title,
      url: absoluteSiteUrl(siteUrl, `/photos/${image.slug}`),
      contentHtml: "",
      contentText,
      sections: contentText
        ? [{ anchor: "section-1", heading: image.title, text: contentText }]
        : [],
      metadata,
      checksum: checksumFor({
        title: image.title,
        contentText,
        metadata
      }),
      updatedAt: (image.publishedAt || image.createdAt).toISOString()
    });
  }

  for (const video of videos) {
    const contentText = normalizeAgentText(video.description);
    const metadata = {
      slug: video.slug,
      category: video.category?.name || null,
      categorySlug: video.category?.slug || null,
      tags: video.tags.map((tag) => tag.name),
      publishedAt: video.publishedAt?.toISOString() || null,
      posterUrl: video.posterAsset?.publicUrl || null,
      durationSeconds: video.videoAsset.durationSeconds || null
    };

    items.push({
      source: "website",
      sourceId: video.id,
      type: "video",
      title: video.title,
      url: absoluteSiteUrl(siteUrl, `/videos/${video.slug}`),
      contentHtml: "",
      contentText,
      sections: contentText
        ? [{ anchor: "section-1", heading: video.title, text: contentText }]
        : [],
      metadata,
      checksum: checksumFor({
        title: video.title,
        contentText,
        metadata
      }),
      updatedAt: video.updatedAt.toISOString()
    });
  }

  const aboutUpdatedAt = settings?.updatedAt || new Date(0);
  items.push(
    pageItem(
      "about-page",
      "关于团队",
      "/about",
      ABOUT_PAGE_HTML,
      aboutUpdatedAt,
      { staticPage: true },
      siteUrl
    )
  );

  for (const tour of GUIDED_TOURS) {
    const tourHtml = [
      `<h2>${tour.title}</h2>`,
      `<p>${tour.summary}</p>`,
      ...tour.stops.map(
        (stop) =>
          `<section data-agent-section="${stop.id}" data-agent-title="${stop.eyebrow} · ${stop.title}">` +
          `<h3>${stop.eyebrow} · ${stop.title}</h3>` +
          `<p>${stop.narration}</p>` +
          `<p>页面：${stop.href}${stop.heading ? `；定位：${stop.heading}` : ""}</p>` +
          `<p>图片：${stop.image.src}；说明：${stop.image.caption}</p>` +
          `</section>`
      )
    ].join("");
    items.push(
      pageItem(
        `tour-${tour.id}`,
        tour.title,
        "/",
        tourHtml,
        new Date(),
        {
          tourId: tour.id,
          version: tour.version,
          kind: "guided-tour",
          stopCount: tour.stops.length,
          durationMinutes: tour.durationMinutes,
          route: tour
        },
        siteUrl
      )
    );
  }

  if (settings) {
    const settingsText = normalizeAgentText(
      `${settings.siteName}\n${settings.siteDescription}`
    );
    items.push(
      pageItem(
        "site-settings",
        "站点信息",
        "/",
        `<p>${settings.siteName}</p><p>${settings.siteDescription}</p>`,
        settings.updatedAt,
        {
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          siteUrl: settings.siteUrl
        },
        siteUrl
      )
    );
    const siteSettingsItem = items.at(-1);
    if (siteSettingsItem) {
      siteSettingsItem.contentText = settingsText;
    }
  }

  items.sort(
    (left, right) =>
      left.updatedAt.localeCompare(right.updatedAt) ||
      left.sourceId.localeCompare(right.sourceId)
  );

  const cursorValue = decodeAgentCursor(cursor);
  const remaining = cursorValue
    ? items.filter(
        (item) =>
          item.updatedAt > cursorValue.updatedAt ||
          (item.updatedAt === cursorValue.updatedAt &&
            item.sourceId > cursorValue.sourceId)
      )
    : items;
  const pageItems = remaining.slice(0, limit);
  const hasMore = remaining.length > pageItems.length;
  const lastItem = pageItems.at(-1);

  return {
    version: "1",
    mode,
    generatedAt: new Date().toISOString(),
    siteUrl,
    items: pageItems,
    hasMore,
    nextCursor:
      hasMore && lastItem
        ? encodeAgentCursor({
            updatedAt: lastItem.updatedAt,
            sourceId: lastItem.sourceId
          })
        : null
  };
}
