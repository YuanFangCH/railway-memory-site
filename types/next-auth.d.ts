import "next-auth";
import "next-auth/jwt";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    username?: string;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      username?: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: UserRole;
  }
}
