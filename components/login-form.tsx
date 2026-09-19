"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      username: values.username,
      password: values.password
    });

    setLoading(false);

    if (!result || result.error) {
      setError("用户名或密码不正确");
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl") || "/admin";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      className="mx-auto grid max-w-md gap-5 rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <h1 className="text-xl font-semibold tracking-normal">后台登录</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          使用管理员账号登录
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="admin"
          {...register("username")}
        />
        {errors.username ? (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={loading}>
        {loading ? "正在登录" : "登录"}
      </Button>
    </form>
  );
}
