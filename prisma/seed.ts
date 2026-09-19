import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD?.trim();
  const displayName = process.env.ADMIN_DISPLAY_NAME || "Administrator";

  if (!password || password === "change-me-now") {
    throw new Error(
      "ADMIN_PASSWORD must be set to a non-placeholder value before seeding."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existingAdmin = await prisma.user.findUnique({ where: { username } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username,
        displayName,
        passwordHash,
        role: "SUPER_ADMIN"
      }
    });
  } else {
    await prisma.user.update({
      where: { username },
      data: {
        displayName,
        role: "SUPER_ADMIN"
      }
    });
  }

  const siteName = process.env.SITE_NAME || "铁路记忆馆";
  const siteDescription =
    process.env.SITE_DESCRIPTION ||
    "面向铁路文化内容的开源资料馆与内容管理平台。";
  const siteUrl = process.env.SITE_URL || "http://localhost:3000";

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {
      siteName,
      siteDescription,
      siteUrl,
      seoTitleTemplate: "%s | {siteName}"
    },
    create: {
      id: 1,
      siteName,
      siteDescription,
      siteUrl,
      socialLinks: [],
      seoTitleTemplate: "%s | {siteName}"
    }
  });

  console.log("Seed completed: admin user and site settings. No sample content.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
