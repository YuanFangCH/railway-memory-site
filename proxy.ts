import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    .trim();
  const secureCookie =
    forwardedProto === "https" || request.nextUrl.protocol === "https:";
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie
  });

  const isApi = request.nextUrl.pathname.startsWith("/api/admin");
  const isPage = request.nextUrl.pathname.startsWith("/admin");
  const isLoginRoute = request.nextUrl.pathname === "/api/admin/login";

  if (!token && isApi && !isLoginRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!token && isPage && !isLoginRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    const role = token.role || "TEAM_MEMBER";
    const isAccountApi = request.nextUrl.pathname.startsWith(
      "/api/admin/accounts"
    );
    const isAccountPage = request.nextUrl.pathname.startsWith(
      "/admin/accounts"
    );
    const isReadOnlyMethod = ["GET", "HEAD", "OPTIONS"].includes(
      request.method
    );

    if ((isAccountApi || isAccountPage) && role !== "SUPER_ADMIN") {
      if (isAccountApi) {
        return NextResponse.json(
          { error: "只有超级管理员可以管理账号" },
          { status: 403 }
        );
      }

      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (isApi && role !== "SUPER_ADMIN" && !isReadOnlyMethod) {
      return NextResponse.json(
        { error: "只读账号不能执行修改操作" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
