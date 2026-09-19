"use client";

import {
  KeyRound,
  Loader2,
  Pencil,
  Save,
  Trash2,
  UserPlus,
  X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type AccountRole = "SUPER_ADMIN" | "TEAM_MEMBER";

type AccountRecord = {
  id: string;
  username: string;
  displayName: string;
  role: AccountRole;
  createdAt: string;
  isCurrent: boolean;
};

type AccountFormValues = {
  username: string;
  displayName: string;
  password: string;
  role: AccountRole;
};

const emptyForm: AccountFormValues = {
  username: "",
  displayName: "",
  password: "",
  role: "TEAM_MEMBER"
};

function roleLabel(role: AccountRole) {
  return role === "SUPER_ADMIN" ? "超级管理员" : "团队成员";
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

async function readError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data?.error || fallback;
}

export function AccountsManager({
  initialItems
}: {
  initialItems: AccountRecord[];
}) {
  const [items, setItems] = useState(initialItems);
  const [createValues, setCreateValues] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState(emptyForm);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createAccount() {
    setCreating(true);
    const response = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createValues)
    });
    setCreating(false);

    if (!response.ok) {
      toast.error(await readError(response, "创建账号失败"));
      return;
    }

    const account = (await response.json()) as AccountRecord;
    setItems((current) => [...current, account]);
    setCreateValues(emptyForm);
    toast.success("账号已创建");
  }

  function startEditing(account: AccountRecord) {
    setResettingId(null);
    setResetPassword("");
    setEditingId(account.id);
    setEditValues({
      username: account.username,
      displayName: account.displayName,
      password: "",
      role: account.role
    });
  }

  async function saveAccount(accountId: string) {
    setSavingId(accountId);
    const response = await fetch(`/api/admin/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editValues)
    });
    setSavingId(null);

    if (!response.ok) {
      toast.error(await readError(response, "保存账号失败"));
      return;
    }

    const account = (await response.json()) as AccountRecord;
    setItems((current) =>
      current.map((item) => (item.id === account.id ? account : item))
    );
    setEditingId(null);
    setEditValues(emptyForm);
    toast.success("账号信息已更新");
  }

  async function resetAccountPassword(account: AccountRecord) {
    setSavingId(account.id);
    const response = await fetch(`/api/admin/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: account.username,
        displayName: account.displayName,
        password: resetPassword,
        role: account.role
      })
    });
    setSavingId(null);

    if (!response.ok) {
      toast.error(await readError(response, "重置密码失败"));
      return;
    }

    setResettingId(null);
    setResetPassword("");
    toast.success("密码已重置");
  }

  async function deleteAccount(account: AccountRecord) {
    if (!window.confirm(`确定删除账号“${account.username}”吗？此操作不可撤销。`)) {
      return;
    }

    setDeletingId(account.id);
    const response = await fetch(`/api/admin/accounts/${account.id}`, {
      method: "DELETE"
    });
    setDeletingId(null);

    if (!response.ok) {
      toast.error(await readError(response, "删除账号失败"));
      return;
    }

    setItems((current) => current.filter((item) => item.id !== account.id));
    toast.success("账号已删除");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-5 text-card-foreground">
        <div className="mb-4 flex items-center gap-2">
          <UserPlus className="size-4 text-primary" />
          <h2 className="font-semibold">新增账号</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr_150px_auto] md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="new-username">用户名</Label>
            <Input
              id="new-username"
              autoComplete="off"
              value={createValues.username}
              onChange={(event) =>
                setCreateValues((current) => ({
                  ...current,
                  username: event.target.value
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-display-name">显示名称</Label>
            <Input
              id="new-display-name"
              autoComplete="off"
              value={createValues.displayName}
              onChange={(event) =>
                setCreateValues((current) => ({
                  ...current,
                  displayName: event.target.value
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-password">初始密码</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={createValues.password}
              onChange={(event) =>
                setCreateValues((current) => ({
                  ...current,
                  password: event.target.value
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-role">角色</Label>
            <Select
              id="new-role"
              value={createValues.role}
              onChange={(event) =>
                setCreateValues((current) => ({
                  ...current,
                  role: event.target.value as AccountRole
                }))
              }
            >
              <option value="TEAM_MEMBER">团队成员</option>
              <option value="SUPER_ADMIN">超级管理员</option>
            </Select>
          </div>
          <Button
            type="button"
            disabled={creating}
            onClick={createAccount}
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            添加账号
          </Button>
        </div>
      </section>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">用户名</th>
              <th className="px-4 py-3 font-medium">显示名称</th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((account) => {
              const isEditing = editingId === account.id;
              const isResetting = resettingId === account.id;
              const isSaving = savingId === account.id;

              return (
                <tr key={account.id} className="align-middle">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        aria-label="用户名"
                        value={editValues.username}
                        onChange={(event) =>
                          setEditValues((current) => ({
                            ...current,
                            username: event.target.value
                          }))
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{account.username}</span>
                        {account.isCurrent ? (
                          <Badge variant="secondary">当前登录</Badge>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        aria-label="显示名称"
                        value={editValues.displayName}
                        onChange={(event) =>
                          setEditValues((current) => ({
                            ...current,
                            displayName: event.target.value
                          }))
                        }
                      />
                    ) : (
                      account.displayName
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Select
                        aria-label="角色"
                        value={editValues.role}
                        onChange={(event) =>
                          setEditValues((current) => ({
                            ...current,
                            role: event.target.value as AccountRole
                          }))
                        }
                      >
                        <option value="TEAM_MEMBER">团队成员</option>
                        <option value="SUPER_ADMIN">超级管理员</option>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          account.role === "SUPER_ADMIN"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {roleLabel(account.role)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatCreatedAt(account.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-h-9 items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="保存"
                            aria-label="保存账号"
                            disabled={isSaving}
                            onClick={() => saveAccount(account.id)}
                          >
                            {isSaving ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Save className="size-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="取消"
                            aria-label="取消编辑"
                            onClick={() => {
                              setEditingId(null);
                              setEditValues(emptyForm);
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : isResetting ? (
                        <>
                          <Input
                            type="password"
                            className="w-52"
                            aria-label="新密码"
                            autoComplete="new-password"
                            placeholder="新密码"
                            value={resetPassword}
                            onChange={(event) =>
                              setResetPassword(event.target.value)
                            }
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="确认重置"
                            aria-label="确认重置密码"
                            disabled={isSaving}
                            onClick={() => resetAccountPassword(account)}
                          >
                            {isSaving ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Save className="size-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="取消"
                            aria-label="取消重置密码"
                            onClick={() => {
                              setResettingId(null);
                              setResetPassword("");
                            }}
                          >
                            <X className="size-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="编辑账号"
                            aria-label={`编辑 ${account.username}`}
                            onClick={() => startEditing(account)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="重置密码"
                            aria-label={`重置 ${account.username} 的密码`}
                            onClick={() => {
                              setEditingId(null);
                              setResetPassword("");
                              setResettingId(account.id);
                            }}
                          >
                            <KeyRound className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title={
                              account.isCurrent
                                ? "不能删除当前登录账号"
                                : "删除账号"
                            }
                            aria-label={`删除 ${account.username}`}
                            disabled={
                              account.isCurrent || deletingId === account.id
                            }
                            onClick={() => deleteAccount(account)}
                          >
                            {deletingId === account.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4 text-destructive" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
