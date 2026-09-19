import {
  isUniqueConstraintError,
  resolveSlug
} from "@/lib/api/content";
import {
  AgentWriteError,
  recordAgentWriteAudit,
  sessionCanPublish,
  summarizeAgentWriteRequest
} from "@/lib/agent-write";
import { prisma } from "@/lib/db";
import {
  imageSchema,
  postSchema,
  videoSchema
} from "@/lib/validators/content";

type WriteSession = {
  id: string;
  mode: string;
  scopes: string[];
};

function assertDraftStatus(status: string) {
  if (status !== "DRAFT") {
    throw new AgentWriteError("agent_writes_are_draft_only", 403);
  }
}

export function assertContentUpdateAllowed(
  session: WriteSession,
  existingStatus: string,
  requestedStatus: string
) {
  if (requestedStatus === "ARCHIVED") {
    throw new AgentWriteError("archiving_is_not_allowed", 403);
  }
  if (existingStatus === "ARCHIVED") {
    throw new AgentWriteError("archived_content_is_read_only", 409);
  }
  if (existingStatus === "DRAFT") {
    if (requestedStatus === "DRAFT") {
      return;
    }
    throw new AgentWriteError("use_publish_endpoint_for_drafts", 409);
  }
  if (existingStatus === "PUBLISHED") {
    if (requestedStatus !== "PUBLISHED") {
      throw new AgentWriteError("published_content_cannot_revert_status", 403);
    }
    if (!sessionCanPublish(session)) {
      throw new AgentWriteError("publish_scope_required", 403);
    }
    return;
  }
  throw new AgentWriteError("unsupported_content_status", 409);
}

function requirePublishSession(session: WriteSession) {
  if (!sessionCanPublish(session)) {
    throw new AgentWriteError("publish_scope_required", 403);
  }
}

export function assertDraftCanBePublished(
  session: WriteSession,
  existingStatus: string
) {
  requirePublishSession(session);
  if (existingStatus !== "DRAFT") {
    throw new AgentWriteError("only_drafts_can_be_published", 409);
  }
}

function requireScope(session: WriteSession, scope: string) {
  if (!session.scopes.includes(scope)) {
    throw new AgentWriteError("write_scope_missing", 403);
  }
}

async function existingCategory(id: string | null | undefined) {
  if (!id) {
    return null;
  }
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AgentWriteError("category_not_found", 400);
  }
  return category;
}

async function existingTags(tagNames: string[]) {
  const names = Array.from(new Set(tagNames.map((name) => name.trim()).filter(Boolean)));
  if (!names.length) {
    return [];
  }
  const tags = await prisma.tag.findMany({
    where: { name: { in: names } }
  });
  if (tags.length !== names.length) {
    throw new AgentWriteError("tag_not_found", 400);
  }
  return tags;
}

async function assertImageAsset(id: string | null | undefined, poster = false) {
  if (!id) {
    if (poster) {
      return null;
    }
    throw new AgentWriteError("image_asset_required", 400);
  }
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset || (asset.kind !== "IMAGE" && !(poster && asset.kind === "POSTER"))) {
    throw new AgentWriteError(poster ? "poster_asset_not_found" : "image_asset_not_found", 400);
  }
  return asset;
}

async function assertVideoAsset(id: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset || asset.kind !== "VIDEO") {
    throw new AgentWriteError("video_asset_not_found", 400);
  }
  return asset;
}

export async function createAgentPostDraft(
  session: WriteSession,
  input: unknown
) {
  requireScope(session, "posts:write");
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    throw new AgentWriteError(parsed.error.issues[0]?.message || "invalid_post", 400);
  }
  const data = parsed.data;
  assertDraftStatus(data.status);
  const [category, tags, cover] = await Promise.all([
    existingCategory(data.categoryId),
    existingTags(data.tagNames),
    data.coverImageId
      ? prisma.image.findUnique({ where: { id: data.coverImageId } })
      : null
  ]);
  if (data.coverImageId && !cover) {
    throw new AgentWriteError("cover_image_not_found", 400);
  }

  try {
    const post = await prisma.post.create({
      data: {
        slug: resolveSlug(data.slug, data.title),
        title: data.title,
        summary: data.summary,
        content: data.content,
        coverImageId: cover?.id || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: "DRAFT",
        publishedAt: null,
        categoryId: category?.id || null,
        tags: { connect: tags.map((tag) => ({ id: tag.id })) }
      },
      include: { category: true, tags: true, coverImage: true }
    });
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "create",
      contentType: "post",
      contentId: post.id,
      success: true,
      request: summarizeAgentWriteRequest(data),
      result: { id: post.id, slug: post.slug, status: post.status }
    });
    return post;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AgentWriteError("slug_already_exists", 409);
    }
    throw error;
  }
}

export async function updateAgentPostDraft(
  session: WriteSession,
  id: string,
  input: unknown
) {
  requireScope(session, "posts:write");
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw new AgentWriteError("post_not_found", 404);
  }
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    throw new AgentWriteError(parsed.error.issues[0]?.message || "invalid_post", 400);
  }
  const data = parsed.data;
  assertContentUpdateAllowed(session, existing.status, data.status);
  const [category, tags, cover] = await Promise.all([
    existingCategory(data.categoryId),
    existingTags(data.tagNames),
    data.coverImageId
      ? prisma.image.findUnique({ where: { id: data.coverImageId } })
      : null
  ]);
  if (data.coverImageId && !cover) {
    throw new AgentWriteError("cover_image_not_found", 400);
  }

  try {
    const post = await prisma.post.update({
      where: { id },
      data: {
        slug: resolveSlug(data.slug, data.title),
        title: data.title,
        summary: data.summary,
        content: data.content,
        coverImageId: cover?.id || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishedAt: existing.publishedAt,
        categoryId: category?.id || null,
        tags: { set: tags.map((tag) => ({ id: tag.id })) }
      },
      include: { category: true, tags: true, coverImage: true }
    });
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "update",
      contentType: "post",
      contentId: post.id,
      success: true,
      request: summarizeAgentWriteRequest(data),
      result: { id: post.id, slug: post.slug, status: post.status }
    });
    return post;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AgentWriteError("slug_already_exists", 409);
    }
    throw error;
  }
}

export async function publishAgentPost(
  session: WriteSession,
  id: string
) {
  requireScope(session, "posts:write");
  requirePublishSession(session);
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw new AgentWriteError("post_not_found", 404);
  }
  assertDraftCanBePublished(session, existing.status);
  const publishedAt = new Date();
  const post = await prisma.post.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt },
    include: { category: true, tags: true, coverImage: true }
  });
  await recordAgentWriteAudit({
    sessionId: session.id,
    action: "publish",
    contentType: "post",
    contentId: post.id,
    success: true,
    request: { id },
    result: {
      id: post.id,
      slug: post.slug,
      status: post.status,
      publishedAt: post.publishedAt?.toISOString()
    }
  });
  return post;
}

export async function createAgentImageDraft(
  session: WriteSession,
  input: unknown
) {
  requireScope(session, "images:write");
  const parsed = imageSchema.safeParse(input);
  if (!parsed.success) {
    throw new AgentWriteError(parsed.error.issues[0]?.message || "invalid_image", 400);
  }
  const data = parsed.data;
  assertDraftStatus(data.status);
  await assertImageAsset(data.assetId);
  try {
    const image = await prisma.image.create({
      data: {
        slug: resolveSlug(data.slug, data.title),
        title: data.title,
        description: data.description,
        album: data.album || null,
        assetId: data.assetId,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: "DRAFT",
        publishedAt: null
      },
      include: { asset: true }
    });
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "create",
      contentType: "image",
      contentId: image.id,
      success: true,
      request: summarizeAgentWriteRequest(data),
      result: { id: image.id, slug: image.slug, status: image.status }
    });
    return image;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AgentWriteError("slug_already_exists", 409);
    }
    throw error;
  }
}

export async function updateAgentImageDraft(
  session: WriteSession,
  id: string,
  input: unknown
) {
  requireScope(session, "images:write");
  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) {
    throw new AgentWriteError("image_not_found", 404);
  }
  const parsed = imageSchema.safeParse(input);
  if (!parsed.success) {
    throw new AgentWriteError(parsed.error.issues[0]?.message || "invalid_image", 400);
  }
  const data = parsed.data;
  assertContentUpdateAllowed(session, existing.status, data.status);
  await assertImageAsset(data.assetId);
  try {
    const image = await prisma.image.update({
      where: { id },
      data: {
        slug: resolveSlug(data.slug, data.title),
        title: data.title,
        description: data.description,
        album: data.album || null,
        assetId: data.assetId,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishedAt: existing.publishedAt
      },
      include: { asset: true }
    });
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "update",
      contentType: "image",
      contentId: image.id,
      success: true,
      request: summarizeAgentWriteRequest(data),
      result: { id: image.id, slug: image.slug, status: image.status }
    });
    return image;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AgentWriteError("slug_already_exists", 409);
    }
    throw error;
  }
}

export async function publishAgentImage(
  session: WriteSession,
  id: string
) {
  requireScope(session, "images:write");
  requirePublishSession(session);
  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) {
    throw new AgentWriteError("image_not_found", 404);
  }
  assertDraftCanBePublished(session, existing.status);
  const image = await prisma.image.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    include: { asset: true }
  });
  await recordAgentWriteAudit({
    sessionId: session.id,
    action: "publish",
    contentType: "image",
    contentId: image.id,
    success: true,
    request: { id },
    result: {
      id: image.id,
      slug: image.slug,
      status: image.status,
      publishedAt: image.publishedAt?.toISOString()
    }
  });
  return image;
}

export async function createAgentVideoDraft(
  session: WriteSession,
  input: unknown
) {
  requireScope(session, "videos:write");
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) {
    throw new AgentWriteError(parsed.error.issues[0]?.message || "invalid_video", 400);
  }
  const data = parsed.data;
  assertDraftStatus(data.status);
  const [category, tags] = await Promise.all([
    existingCategory(data.categoryId),
    existingTags(data.tagNames),
    assertVideoAsset(data.videoAssetId),
    assertImageAsset(data.posterAssetId, true)
  ]);
  try {
    const video = await prisma.video.create({
      data: {
        slug: resolveSlug(data.slug, data.title),
        title: data.title,
        description: data.description,
        videoAssetId: data.videoAssetId,
        posterAssetId: data.posterAssetId || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: "DRAFT",
        publishedAt: null,
        categoryId: category?.id || null,
        tags: { connect: tags.map((tag) => ({ id: tag.id })) }
      },
      include: { category: true, tags: true, videoAsset: true, posterAsset: true }
    });
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "create",
      contentType: "video",
      contentId: video.id,
      success: true,
      request: summarizeAgentWriteRequest(data),
      result: { id: video.id, slug: video.slug, status: video.status }
    });
    return video;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AgentWriteError("slug_already_exists", 409);
    }
    throw error;
  }
}

export async function updateAgentVideoDraft(
  session: WriteSession,
  id: string,
  input: unknown
) {
  requireScope(session, "videos:write");
  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) {
    throw new AgentWriteError("video_not_found", 404);
  }
  const parsed = videoSchema.safeParse(input);
  if (!parsed.success) {
    throw new AgentWriteError(parsed.error.issues[0]?.message || "invalid_video", 400);
  }
  const data = parsed.data;
  assertContentUpdateAllowed(session, existing.status, data.status);
  const [category, tags] = await Promise.all([
    existingCategory(data.categoryId),
    existingTags(data.tagNames),
    assertVideoAsset(data.videoAssetId),
    assertImageAsset(data.posterAssetId, true)
  ]);
  try {
    const video = await prisma.video.update({
      where: { id },
      data: {
        slug: resolveSlug(data.slug, data.title),
        title: data.title,
        description: data.description,
        videoAssetId: data.videoAssetId,
        posterAssetId: data.posterAssetId || null,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        status: data.status,
        publishedAt: existing.publishedAt,
        categoryId: category?.id || null,
        tags: { set: tags.map((tag) => ({ id: tag.id })) }
      },
      include: { category: true, tags: true, videoAsset: true, posterAsset: true }
    });
    await recordAgentWriteAudit({
      sessionId: session.id,
      action: "update",
      contentType: "video",
      contentId: video.id,
      success: true,
      request: summarizeAgentWriteRequest(data),
      result: { id: video.id, slug: video.slug, status: video.status }
    });
    return video;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AgentWriteError("slug_already_exists", 409);
    }
    throw error;
  }
}

export async function publishAgentVideo(
  session: WriteSession,
  id: string
) {
  requireScope(session, "videos:write");
  requirePublishSession(session);
  const existing = await prisma.video.findUnique({ where: { id } });
  if (!existing) {
    throw new AgentWriteError("video_not_found", 404);
  }
  assertDraftCanBePublished(session, existing.status);
  const video = await prisma.video.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: new Date() },
    include: {
      category: true,
      tags: true,
      videoAsset: true,
      posterAsset: true
    }
  });
  await recordAgentWriteAudit({
    sessionId: session.id,
    action: "publish",
    contentType: "video",
    contentId: video.id,
    success: true,
    request: { id },
    result: {
      id: video.id,
      slug: video.slug,
      status: video.status,
      publishedAt: video.publishedAt?.toISOString()
    }
  });
  return video;
}
