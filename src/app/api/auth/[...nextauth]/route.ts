import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import bcrypt from "bcrypt";

import clientPromise from "@/lib/mongodb";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { ROLES, type UserRole } from "@/lib/roles";

type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  rol: UserRole;
  sucursal: string | null; // ObjectId -> string
};

type SessionUpdate = {
  name?: string | null;
  image?: string | null;
  sucursal?: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toSessionUpdate(v: unknown): SessionUpdate {
  if (!isRecord(v)) return {};
  const out: SessionUpdate = {};

  const name = v["name"];
  if (typeof name === "string" || name === null) out.name = name;

  const image = v["image"];
  if (typeof image === "string" || image === null) out.image = image;

  const sucursal = v["sucursal"];
  if (typeof sucursal === "string" || sucursal === null) out.sucursal = sucursal;

  return out;
}

function isAppUser(v: unknown): v is AppUser {
  if (!isRecord(v)) return false;

  const id = v["id"];
  const rol = v["rol"];
  const sucursal = v["sucursal"];

  const idOk = typeof id === "string";
  const rolOk = typeof rol === "string";
  const sucOk = typeof sucursal === "string" || sucursal === null;

  return idOk && rolOk && sucOk;
}

// ✅ IMPORTANTE: en route.ts NO se puede exportar authOptions
const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        await dbConnect();

        const user = await UserModel.findOne({ email: credentials.email }).select("+password");

        if (!user || !user.password) {
          throw new Error("Usuario no encontrado");
        }

        if (user.activo === false) {
          throw new Error("Usuario inactivo");
        }

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) {
          throw new Error("Contraseña incorrecta");
        }

        const rolDb = String(user.rol || "vendedor");
        const rol: UserRole = (ROLES as readonly string[]).includes(rolDb)
          ? (rolDb as UserRole)
          : "vendedor";

        const appUser: AppUser = {
          id: user._id.toString(),
          name: user.name ?? null,
          email: user.email ?? null,
          rol,
          sucursal: user.sucursal ? user.sucursal.toString() : null,
        };

        return appUser;
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // login inicial
      if (user && isAppUser(user)) {
        token.id = user.id;
        token.rol = user.rol;
        token.sucursal = user.sucursal;

        token.name = user.name ?? token.name ?? null;
        token.email = user.email ?? token.email ?? null;
      } else {
        // defensivo: normalizar sucursal si viene mal tipada
        token.sucursal = typeof token.sucursal === "string" ? token.sucursal : null;
      }

      // permitir update({ sucursal, name })
      if (trigger === "update") {
        const upd = toSessionUpdate(session);

        if (upd.name !== undefined) token.name = upd.name;
        if (upd.sucursal !== undefined) token.sucursal = upd.sucursal;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : "";
      session.user.rol = (token.rol ?? "vendedor") as UserRole;
      session.user.sucursal = token.sucursal ?? null;

      session.user.name = (token.name as string | null) ?? session.user.name ?? null;
      session.user.email = (token.email as string | null) ?? session.user.email ?? null;

      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
