import { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { ROLES, type UserRole } from "@/lib/roles";

/** User que retorna authorize() */
type AppUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  rol: UserRole;
  image?: string | null;
};

/** Payload permitido en useSession().update(...) */
type SessionUpdate = {
  name?: string | null;
  image?: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function toSessionUpdate(v: unknown): SessionUpdate {
  if (!isRecord(v)) return {};
  const out: SessionUpdate = {};
  if ("name" in v && (typeof v.name === "string" || v.name === null)) out.name = v.name;
  if ("image" in v && (typeof v.image === "string" || v.image === null)) out.image = v.image;
  return out;
}

function isAppUser(v: unknown): v is AppUser {
  if (!isRecord(v)) return false;
  const idOk = typeof v.id === "string";
  const rolOk = typeof v.rol === "string";
  return idOk && rolOk;
}

export const authOptions: NextAuthOptions = {
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

        // Traemos password (select:false) + el resto de campos.
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
          image: user.image ?? null,
        };

        return appUser;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Login inicial: "user" existe (viene de authorize)
      if (user && isAppUser(user)) {
        token.id = user.id;
        token.rol = user.rol;
        token.name = user.name ?? token.name ?? null;
        token.image = user.image ?? token.image ?? null;
      } else {
        // Fallback defensivo: asegurar id string
        token.id = typeof token.id === "string" ? token.id : token.sub ?? "";
      }

      // useSession().update({ name, image })
      if (trigger === "update") {
        const upd = toSessionUpdate(session);
        if (upd.name !== undefined) token.name = upd.name;
        if (upd.image !== undefined) token.image = upd.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.rol = token.rol as UserRole;

        session.user.name = (token.name as JWT["name"]) ?? session.user.name ?? null;
        session.user.image = (token.image as JWT["image"]) ?? session.user.image ?? null;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
