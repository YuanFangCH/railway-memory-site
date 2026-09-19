"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AssetUploadField,
  type SelectedAsset
} from "@/components/admin/asset-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SocialLink = { label: string; url: string };

type SettingsRecord = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  seoTitleTemplate: string;
  avatarAssetId: string | null;
  avatarAsset: {
    id: string;
    originalName: string;
    publicUrl: string;
    thumbnailUrl: string | null;
  } | null;
  socialLinks: SocialLink[];
};

const settingsFormSchema = z.object({
  siteName: z.string().trim().min(1, "站点名称不能为空"),
  siteDescription: z.string().trim().min(1, "站点描述不能为空"),
  siteUrl: z.string().trim().min(1, "站点地址不能为空"),
  seoTitleTemplate: z.string().trim().min(1, "SEO 标题模板不能为空")
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function SettingsForm({ settings }: { settings: SettingsRecord }) {
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<SelectedAsset | null>(
    settings.avatarAsset
      ? {
          id: settings.avatarAsset.id,
          originalName: settings.avatarAsset.originalName,
          publicUrl: settings.avatarAsset.publicUrl,
          thumbnailUrl: settings.avatarAsset.thumbnailUrl
        }
      : null
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    settings.socialLinks.length ? settings.socialLinks : [{ label: "", url: "" }]
  );
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      siteUrl: settings.siteUrl,
      seoTitleTemplate: settings.seoTitleTemplate
    }
  });

  function updateSocialLink(index: number, field: keyof SocialLink, value: string) {
    setSocialLinks((links) =>
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  }

  async function onSubmit(values: SettingsFormValues) {
    const validLinks = socialLinks.filter(
      (link) => link.label.trim() && link.url.trim()
    );

    if (socialLinks.some((link) => (link.label.trim() || link.url.trim()) && (!link.label.trim() || !link.url.trim()))) {
      toast.error("社交链接需要同时填写名称和地址");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        avatarAssetId: avatar?.id || null,
        socialLinks: validLinks
      })
    });
    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error || "保存失败");
      return;
    }

    toast.success("设置已保存");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="grid gap-5 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="grid gap-2">
          <Label htmlFor="siteName">站点名称</Label>
          <Input id="siteName" {...register("siteName")} />
          {errors.siteName ? (
            <p className="text-sm text-destructive">{errors.siteName.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="siteDescription">站点描述</Label>
          <Textarea
            id="siteDescription"
            rows={3}
            {...register("siteDescription")}
          />
          {errors.siteDescription ? (
            <p className="text-sm text-destructive">
              {errors.siteDescription.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="siteUrl">站点地址</Label>
          <Input id="siteUrl" placeholder="https://example.com" {...register("siteUrl")} />
          {errors.siteUrl ? (
            <p className="text-sm text-destructive">{errors.siteUrl.message}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="seoTitleTemplate">SEO 标题模板</Label>
          <Input id="seoTitleTemplate" {...register("seoTitleTemplate")} />
          <p className="text-xs text-muted-foreground">
            使用 %s 代表内容标题，{`{siteName}`} 代表站点名称
          </p>
        </div>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Label>社交链接</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSocialLinks((links) => [...links, { label: "", url: "" }])}
            >
              <Plus className="size-4" />
              添加
            </Button>
          </div>
          {socialLinks.map((link, index) => (
            <div key={index} className="grid grid-cols-[1fr_1.6fr_auto] items-end gap-2">
              <div className="grid gap-1">
                <Label className="sr-only">名称</Label>
                <Input
                  value={link.label}
                  placeholder="名称"
                  onChange={(event) =>
                    updateSocialLink(index, "label", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label className="sr-only">地址</Label>
                <Input
                  value={link.url}
                  placeholder="https://"
                  onChange={(event) =>
                    updateSocialLink(index, "url", event.target.value)
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9"
                aria-label="删除链接"
                title="删除链接"
                onClick={() =>
                  setSocialLinks((links) => links.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <aside className="grid content-start gap-5 rounded-lg border bg-card p-5 text-card-foreground">
        <AssetUploadField
          label="站点头像"
          kind="image"
          value={avatar}
          onChange={setAvatar}
        />
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          保存设置
        </Button>
      </aside>
    </form>
  );
}
