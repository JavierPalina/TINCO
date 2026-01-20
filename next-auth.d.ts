// src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
      rol: UserRole;

      // ✅ NUEVO
      sucursal: string | null;
    };
  }

  interface User extends DefaultUser {
    id: string;
    rol: UserRole;

    // ✅ NUEVO
    sucursal: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    rol: UserRole;
    name?: string | null;
    image?: string | null;

    // ✅ NUEVO
    sucursal: string | null;
  }
}
