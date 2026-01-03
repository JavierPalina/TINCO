import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    rol: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    rol: UserRole;
    image?: string;
    name?: string;
  }
}