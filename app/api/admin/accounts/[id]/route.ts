import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { isUniqueConstraintError } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/auth";
import {
  deleteAgentAccount,
  syncAgentAccount
} from "@/lib/agent-account-sync";
import { prisma } from "@/lib/db";
import { accountUpdateSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return apiError("只有超级管理员可以管理账号", 403);
  }

  const { id } = await params;
  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      passwordHash: true,
      createdAt: true
    }
  });

  if (!existing) {
    return apiError("账号不存在", 404);
  }

  const parsedBody = await parseJson(request);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = accountUpdateSchema.safeParse(parsedBody.data);

  if (!result.success) {
    return apiError(result.error.issues[0]?.message || "参数不合法");
  }

  const input = result.data;
  const duplicate = await prisma.user.findFirst({
    where: {
      username: input.username,
      NOT: { id }
    },
    select: { id: true }
  });

  if (duplicate) {
    return apiError("用户名已存在，请更换", 409);
  }

  const data: {
    username: string;
    displayName: string;
    role: "SUPER_ADMIN" | "TEAM_MEMBER";
    passwordHash?: string;
  } = {
    username: input.username,
    displayName: input.displayName,
    role: input.role
  };

  if (existing.role === "SUPER_ADMIN" && input.role !== "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" }
    });

    if (superAdminCount <= 1) {
      return apiError("至少需要保留一个超级管理员账号", 409);
    }
  }

  if (input.password) {
    data.passwordHash = await bcrypt.hash(input.password, 12);
  }

  let user;
  try {
    user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        createdAt: true
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return apiError("用户名已存在，请更换", 409);
    }

    throw error;
  }

  try {
    await syncAgentAccount({
      previousUsername: existing.username,
      username: input.username,
      displayName: input.displayName,
      role: input.role,
      password: input.password
    });
  } catch (error) {
    await prisma.user.update({
      where: { id },
      data: {
        username: existing.username,
        displayName: existing.displayName,
        role: existing.role,
        passwordHash: existing.passwordHash
      }
    });
    return apiError(
      error instanceof Error ? error.message : "保存账号失败",
      503
    );
  }

  return NextResponse.json({
    ...user,
    isCurrent: user.id === session.user.id
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return apiError("只有超级管理员可以管理账号", 403);
  }

  const { id } = await params;

  if (id === session.user.id) {
    return apiError("不能删除当前登录账号", 409);
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      passwordHash: true,
      createdAt: true
    }
  });

  if (!existing) {
    return apiError("账号不存在", 404);
  }

  const userCount = await prisma.user.count();

  if (userCount <= 1) {
    return apiError("至少需要保留一个管理员账号", 409);
  }

  if (existing.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" }
    });

    if (superAdminCount <= 1) {
      return apiError("至少需要保留一个超级管理员账号", 409);
    }
  }

  await prisma.user.delete({ where: { id } });

  try {
    await deleteAgentAccount(existing.username);
  } catch (error) {
    await prisma.user.create({
      data: {
        id: existing.id,
        username: existing.username,
        displayName: existing.displayName,
        role: existing.role,
        passwordHash: existing.passwordHash,
        createdAt: existing.createdAt
      }
    });
    return apiError(
      error instanceof Error ? error.message : "网页讲解助手 Agent 账号删除失败",
      503
    );
  }

  return NextResponse.json({ ok: true });
}
