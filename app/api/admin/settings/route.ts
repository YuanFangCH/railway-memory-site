import { NextResponse } from "next/server";

import { apiError, parseJson } from "@/lib/api/helpers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";
import { settingsSchema } from "@/lib/validators/content";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });

  if (!settings) {
    return apiError("站点设置尚未初始化，请先运行数据库种子脚本", 404);
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const parsedBody = await parseJson(request);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const result = settingsSchema.safeParse(parsedBody.data);

  if (!result.success) {
    return apiError(result.error.issues[0]?.message || "参数不合法");
  }

  const input = result.data;
  const avatarAsset = input.avatarAssetId
    ? await prisma.mediaAsset.findUnique({ where: { id: input.avatarAssetId } })
    : null;

  if (input.avatarAssetId && !avatarAsset) {
    return apiError("头像文件不存在", 400);
  }

  const settings = await prisma.siteSetting.update({
    where: { id: 1 },
    data: {
      siteName: input.siteName,
      siteDescription: input.siteDescription,
      siteUrl: input.siteUrl,
      avatarAssetId: input.avatarAssetId,
      socialLinks: input.socialLinks,
      seoTitleTemplate: input.seoTitleTemplate
    }
  });

  return NextResponse.json(settings);
}
