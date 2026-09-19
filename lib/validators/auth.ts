import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码")
});

export const accountUsernameSchema = z
  .string()
  .trim()
  .min(3, "用户名至少 3 个字符")
  .max(50, "用户名最多 50 个字符")
  .regex(/^[A-Za-z0-9._-]+$/, "用户名只能包含字母、数字、点、下划线和短横线");

export const accountPasswordSchema = z
  .string()
  .min(8, "密码至少 8 个字符")
  .max(128, "密码最多 128 个字符");

export const userRoleSchema = z.enum(["SUPER_ADMIN", "TEAM_MEMBER"], {
  message: "账号角色不合法"
});

export const accountCreateSchema = z.object({
  username: accountUsernameSchema,
  displayName: z.string().trim().min(1, "显示名称不能为空").max(80, "显示名称过长"),
  password: accountPasswordSchema,
  role: userRoleSchema.default("TEAM_MEMBER")
});

export const accountUpdateSchema = z.object({
  username: accountUsernameSchema,
  displayName: z.string().trim().min(1, "显示名称不能为空").max(80, "显示名称过长"),
  password: accountPasswordSchema.or(z.literal("")),
  role: userRoleSchema
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
