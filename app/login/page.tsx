import { Suspense } from "react";

import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "登录"
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
