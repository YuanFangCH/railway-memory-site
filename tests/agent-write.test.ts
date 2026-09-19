import { describe, expect, it, vi } from "vitest";

import {
  generateAgentWriteToken,
  hashAgentWriteToken,
  isAgentWriteAdminAuthorized,
  publicSession,
  sessionCanPublish,
  sessionCreateSchema,
  summarizeAgentWriteRequest
} from "@/lib/agent-write";
import {
  assertContentUpdateAllowed,
  assertDraftCanBePublished
} from "@/lib/agent-write-content";

describe("agent write access", () => {
  it("hashes tokens deterministically and generates opaque tokens", () => {
    const token = generateAgentWriteToken();
    expect(token).toMatch(/^aw_live_[A-Za-z0-9_-]{40,}$/);
    expect(hashAgentWriteToken(token)).toBe(hashAgentWriteToken(token));
    expect(hashAgentWriteToken(token)).toHaveLength(64);
  });

  it("requires the configured write admin bearer token", () => {
    vi.stubEnv("GUIDE_AGENT_WRITE_ADMIN_TOKEN", "test-admin-token");
    expect(
      isAgentWriteAdminAuthorized(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer test-admin-token" }
        })
      )
    ).toBe(true);
    expect(
      isAgentWriteAdminAuthorized(
        new Request("http://localhost", {
          headers: { Authorization: "Bearer wrong" }
        })
      )
    ).toBe(false);
    vi.unstubAllEnvs();
  });

  it("limits sessions to 5-60 minutes", () => {
    expect(sessionCreateSchema.parse({ minutes: 30, purpose: "内容整理" })).toMatchObject({
      minutes: 30,
      mode: "draft-only"
    });
    expect(() =>
      sessionCreateSchema.parse({ minutes: 61, purpose: "内容整理" })
    ).toThrow();
    expect(
      sessionCreateSchema.parse({
        minutes: 30,
        mode: "draft-and-publish",
        purpose: "发布内容"
      })
    ).toMatchObject({ mode: "draft-and-publish" });
    expect(() =>
      sessionCreateSchema.parse({
        minutes: 60,
        mode: "draft-and-publish",
        purpose: "发布内容"
      })
    ).toThrow();
  });

  it("requires the full publish scope set for published-content access", () => {
    expect(sessionCanPublish({ scopes: ["posts:publish"] })).toBe(false);
    expect(
      sessionCanPublish({
        scopes: ["posts:publish", "images:publish", "videos:publish"]
      })
    ).toBe(true);
  });

  it("keeps draft updates draft-only and prevents status regression", () => {
    const draftSession = {
      id: "draft",
      mode: "draft-only",
      scopes: ["posts:write"]
    };
    const publishSession = {
      id: "publish",
      mode: "draft-and-publish",
      scopes: [
        "posts:write",
        "posts:publish",
        "images:publish",
        "videos:publish"
      ]
    };

    expect(() =>
      assertContentUpdateAllowed(draftSession, "DRAFT", "DRAFT")
    ).not.toThrow();
    expect(() =>
      assertContentUpdateAllowed(draftSession, "PUBLISHED", "PUBLISHED")
    ).toThrow("publish_scope_required");
    expect(() =>
      assertContentUpdateAllowed(publishSession, "PUBLISHED", "PUBLISHED")
    ).not.toThrow();
    expect(() =>
      assertContentUpdateAllowed(publishSession, "PUBLISHED", "DRAFT")
    ).toThrow("published_content_cannot_revert_status");
    expect(() =>
      assertContentUpdateAllowed(publishSession, "DRAFT", "ARCHIVED")
    ).toThrow("archiving_is_not_allowed");
    expect(() =>
      assertDraftCanBePublished(draftSession, "DRAFT")
    ).toThrow("publish_scope_required");
    expect(() =>
      assertDraftCanBePublished(publishSession, "DRAFT")
    ).not.toThrow();
    expect(() =>
      assertDraftCanBePublished(publishSession, "PUBLISHED")
    ).toThrow("only_drafts_can_be_published");
  });

  it("reports expired and active sessions", () => {
    const base = {
      id: "session-1",
      scopes: ["posts:write"],
      mode: "draft-only",
      purpose: "测试",
      createdBy: "admin",
      createdAt: new Date(),
      revokedAt: null
    };
    expect(
      publicSession({ ...base, expiresAt: new Date(Date.now() + 60_000) }).active
    ).toBe(true);
    expect(
      publicSession({ ...base, expiresAt: new Date(Date.now() - 60_000) }).active
    ).toBe(false);
  });

  it("omits full draft bodies from audit summaries", () => {
    const summary = summarizeAgentWriteRequest({
      title: "标题",
      slug: "slug",
      status: "DRAFT",
      content: "很长的正文",
      summary: "摘要",
      tagNames: ["铁路"]
    });

    expect(summary).toMatchObject({
      title: "标题",
      slug: "slug",
      status: "DRAFT",
      content: { type: "text", length: 5 },
      summary: { type: "text", length: 2 },
      tagNames: ["铁路"]
    });
  });
});
