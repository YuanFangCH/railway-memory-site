import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function getOptionalSession() {
  return auth();
}
