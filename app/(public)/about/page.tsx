import type { Metadata } from "next";
import { Database, FileText, ImageIcon, Search, Video } from "lucide-react";

import { PageHeader } from "@/components/public/page-header";

export const metadata: Metadata = {
  title: "关于项目",
  description: "铁路记忆馆开源网站的功能说明。"
};

const features = [
  {
    icon: FileText,
    title: "文章管理",
    text: "通过后台创建、编辑、发布和归档文章，支持分类、标签与 SEO 字段。"
  },
  {
    icon: ImageIcon,
    title: "图片与相册",
    text: "上传图片、生成缩略图，并按相册组织内容。"
  },
  {
    icon: Video,
    title: "视频资料",
    text: "管理视频元数据、封面与媒体文件，支持 HTTP Range 播放。"
  },
  {
    icon: Search,
    title: "全文检索",
    text: "使用 PostgreSQL 全文搜索检索已发布内容。"
  },
  {
    icon: Database,
    title: "可配置存储",
    text: "开发环境可使用本地文件，生产环境可切换到 MinIO 或兼容 S3 的对象存储。"
  }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="About"
        title="关于项目"
        description="一个可自行填充内容的铁路文化网站模板"
      />

      <section className="mt-8 max-w-3xl leading-relaxed text-foreground/80">
        <p>
          本仓库提供网站运行时、后台管理、媒体存储、全文检索以及可选的网页讲解 Agent
          接口。仓库不附带任何文章、图片、视频、用户、知识库或生产数据，首次启动后由部署者自行配置和录入。
        </p>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-lg border bg-card p-5 text-card-foreground"
          >
            <span className="grid size-10 place-items-center rounded-md bg-[#005bac] text-white">
              <feature.icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.text}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
