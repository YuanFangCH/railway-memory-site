import { describe, expect, it } from "vitest";

import {
  accountCreateSchema,
  accountUpdateSchema
} from "@/lib/validators/auth";

describe("account validators", () => {
  it("accepts a valid new account", () => {
    const result = accountCreateSchema.safeParse({
      username: "editor.01",
      displayName: "内容编辑",
      password: "strong-password",
      role: "TEAM_MEMBER"
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsafe usernames and short passwords", () => {
    const result = accountCreateSchema.safeParse({
      username: "编辑 01",
      displayName: "内容编辑",
      password: "short",
      role: "TEAM_MEMBER"
    });

    expect(result.success).toBe(false);
  });

  it("allows editing account details without changing the password", () => {
    const result = accountUpdateSchema.safeParse({
      username: "editor.01",
      displayName: "新显示名称",
      password: "",
      role: "TEAM_MEMBER"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid replacement password", () => {
    const result = accountUpdateSchema.safeParse({
      username: "editor.01",
      displayName: "新显示名称",
      password: "1234567",
      role: "TEAM_MEMBER"
    });

    expect(result.success).toBe(false);
  });
});
