import Link from "next/link";

import { AdminHeader } from "@/components/admin/admin-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const readOnly = session.user.role === "TEAM_MEMBER";

  return (
    <div className="min-h-screen">
      <AdminHeader role={session.user.role} />
      {readOnly ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          当前为团队只读账号，可查看后台内容，不能执行修改操作。
        </div>
      ) : null}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <div className="fixed bottom-4 left-4 z-40">
        <Button asChild variant="outline" size="sm">
          <Link href="/">查看公开站点</Link>
        </Button>
      </div>
    </div>
  );
}
