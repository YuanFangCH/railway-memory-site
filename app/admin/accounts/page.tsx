import { AccountsManager } from "@/components/admin/accounts-manager";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAccountsPage() {
  const session = await auth();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">账号管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理网站后台登录账号、显示名称与密码
        </p>
      </div>
      <AccountsManager
        initialItems={users.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          isCurrent: user.id === session?.user?.id
        }))}
      />
    </div>
  );
}
