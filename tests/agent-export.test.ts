import { describe, expect, it } from "vitest";

import {
  decodeAgentCursor,
  encodeAgentCursor,
  extractAgentSections,
  InvalidAgentCursorError,
  stripAgentHtml
} from "@/lib/agent-export";

describe("agent export helpers", () => {
  it("strips unsafe html while preserving readable text", () => {
    expect(
      stripAgentHtml(
        "<script>alert(1)</script><h2>标题</h2><p>正文&nbsp;内容</p>"
      )
    ).toBe("标题\n正文 内容");
  });

  it("extracts explicit agent sections before headings", () => {
    expect(
      extractAgentSections(`
        <h2>普通标题</h2>
        <section data-agent-section="intro" data-agent-title="导语">
          <h2>内部标题</h2><p>第一段</p>
        </section>
      `)
    ).toEqual([
      {
        anchor: "intro",
        heading: "导语",
        text: "内部标题\n第一段"
      }
    ]);
  });

  it("falls back to text blocks when imported content has no headings", () => {
    const sections = extractAgentSections(
      `<p>${"甲".repeat(700)}</p><p>${"乙".repeat(500)}</p>`
    );

    expect(sections.length).toBe(2);
    expect(sections[0].anchor).toBe("section-1");
    expect(sections[1].anchor).toBe("section-2");
  });

  it("round-trips export cursors", () => {
    const cursor = {
      updatedAt: "2026-09-10T01:02:03.000Z",
      sourceId: "post-1"
    };

    expect(decodeAgentCursor(encodeAgentCursor(cursor))).toEqual(cursor);
  });

  it("rejects malformed cursors", () => {
    expect(() => decodeAgentCursor("not-a-cursor")).toThrow(
      InvalidAgentCursorError
    );
  });
});
