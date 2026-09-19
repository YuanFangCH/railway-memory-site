import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { isUniqueConstraintError } from "@/lib/api/content";
import { apiError, parseJson } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/auth";
import { syncAgentAccount } from "@/lib/agent-account-sync";
import { prisma } from "@/lib/db";
import { accountCreateSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return apiError("只有超级管理员可以管理账号", 403);
  }

  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "asc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      createdAt: true
    }
  });

  return NextResponse.json({
    items: users.map((user) => ({
      ...user,
      isCurrent: user.id === session.user.id
    }))
  });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }
  if (session.user.role !== "SUPER_ADMIN") {
    return apiError("只有超级管理员可以管理账号", 403);
  }

  const parsedBody = await parseJson(request);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = accountCreateSchema.safeParse(parsedBody.data);

  if (!result.success) {
    return apiError(result.error.issues[0]?.message || "参数不合法");
  }

  const input = result.data;
  const duplicate = await prisma.user.findUnique({
    where: { username: input.username },
    select: { id: true }
  });

  if (duplicate) {
    return apiError("用户名已存在，请更换", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        passwordHash,
        role: input.role
      },
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
      username: input.username,
      displayName: input.displayName,
      role: input.role,
      password: input.password
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } });
    return apiError(
      error instanceof Error ? error.message : "创建账号失败",
      503
    );
  }

  return NextResponse.json(
    {
      ...user,
      isCurrent: user.id === session.user.id
    },
    { status: 201 }
  );
}
