import { type NextAuthOptions } from "next-auth";
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

  // ✅ sucursal como string (ObjectId)
  sucursal: string | null;
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

  const name = v["name"];
  if (typeof name === "string" || name === null) out.name = name;

  const image = v["image"];
  if (typeof image === "string" || image === null) out.image = image;

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
          sucursal: user.sucursal ? user.sucursal.toString() : null,
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
        token.sucursal = user.sucursal;
      } else {
        // defensivo: normalizar
        token.id = typeof token.id === "string" ? token.id : token.sub ?? "";
        token.sucursal = typeof token.sucursal === "string" ? token.sucursal : null;
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
      // Nota: esto asume que ya tenés module augmentation en src/types/next-auth.d.ts
      // para session.user.id / rol / sucursal, como en el ajuste anterior.
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.rol = (token.rol ?? "vendedor") as UserRole;

        session.user.name = (token.name as JWT["name"]) ?? session.user.name ?? null;
        session.user.image = (token.image as JWT["image"]) ?? session.user.image ?? null;

        session.user.sucursal = token.sucursal ?? null;
      }

      return session;
    },
  },

  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
