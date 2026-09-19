import { NextResponse } from "next/server";
import { AuthError } from "next-auth";

import { signIn } from "@/lib/auth/auth";
import { apiError } from "@/lib/api/helpers";
import { loginSchema } from "@/lib/validators/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return apiError("用户名或密码不能为空", 400);
  }

  try {
    await signIn("credentials", {
      username: result.data.username,
      password: result.data.password,
      redirect: false,
      redirectTo: "/admin"
    });

    return NextResponse.json({ ok: true, redirectTo: "/admin" });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError("用户名或密码不正确", 401);
    }

    throw error;
  }
}
