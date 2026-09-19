import { SettingsForm } from "@/components/admin/settings-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSetting.findUnique({
    where: { id: 1 },
    include: { avatarAsset: true }
  });

  if (!settings) {
    return (
      <div className="rounded-lg border bg-card p-10 text-center text-card-foreground">
        <h1 className="text-xl font-semibold">站点设置尚未初始化</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          请先运行数据库迁移与种子脚本
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">站点设置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          配置站点信息、头像与 SEO 模板
        </p>
      </div>
      <SettingsForm
        settings={{
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          siteUrl: settings.siteUrl,
          seoTitleTemplate: settings.seoTitleTemplate,
          avatarAssetId: settings.avatarAssetId,
          avatarAsset: settings.avatarAsset
            ? {
                id: settings.avatarAsset.id,
                originalName: settings.avatarAsset.originalName,
                publicUrl: settings.avatarAsset.publicUrl,
                thumbnailUrl: settings.avatarAsset.thumbnailUrl
              }
            : null,
          socialLinks: Array.isArray(settings.socialLinks)
            ? (settings.socialLinks as { label: string; url: string }[])
            : []
        }}
      />
    </div>
  );
}
