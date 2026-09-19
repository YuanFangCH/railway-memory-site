import { prisma } from "@/lib/db";

export async function getSiteSettings() {
  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });

  return (
    settings || {
      id: 1,
      siteName: process.env.SITE_NAME || "铁路记忆馆",
      siteDescription:
        process.env.SITE_DESCRIPTION ||
        "面向铁路文化内容的开源资料馆与内容管理平台。",
      siteUrl: process.env.SITE_URL || "http://localhost:3000",
      avatarAssetId: null,
      socialLinks: [],
      seoTitleTemplate: "%s | {siteName}",
      updatedAt: new Date()
    }
  );
}

export function composeSeoTemplate(template: string, title: string, siteName: string) {
  return template.replace("%s", title).replace("{siteName}", siteName);
}
