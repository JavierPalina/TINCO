import NextAuth, { type NextAuthOptions } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { ROLES, type UserRole } from "@/lib/roles";

type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  rol: UserRole;

  // ✅ sucursal como string (ObjectId)
  sucursal: string | null;
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

  if ("name" in v && (typeof v.name === "string" || v.name === null)) out.name = v.name;
  if ("image" in v && (typeof v.image === "string" || v.image === null)) out.image = v.image;
  if ("sucursal" in v && (typeof v.sucursal === "string" || v.sucursal === null)) out.sucursal = v.sucursal;

  return out;
}

function isAppUser(v: unknown): v is AppUser {
  if (!isRecord(v)) return false;

  const idOk = typeof v.id === "string";
  const rolOk = typeof v.rol === "string";
  const sucOk =
    "sucursal" in v &&
    (typeof (v as any).sucursal === "string" || (v as any).sucursal === null);

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

          // ✅ clave: leer sucursal desde user (ObjectId -> string)
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

        // ✅ sucursal al token
        (token as any).sucursal = user.sucursal;

        // opcional
        token.name = user.name ?? token.name ?? null;
        token.email = user.email ?? token.email ?? null;
      } else {
        // defensivo
        (token as any).sucursal = typeof (token as any).sucursal === "string" ? (token as any).sucursal : null;
      }

      // ✅ permitir update({ sucursal })
      if (trigger === "update") {
        const upd = toSessionUpdate(session);

        if (upd.name !== undefined) token.name = upd.name;
        if (upd.sucursal !== undefined) (token as any).sucursal = upd.sucursal;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = typeof (token as any).id === "string" ? (token as any).id : "";
        (session.user as any).rol = (token as any).rol as UserRole;

        // ✅ sucursal a la sesión
        (session.user as any).sucursal = ((token as any).sucursal as string | null) ?? null;

        // opcional
        session.user.name = (token.name as string | null) ?? session.user.name ?? null;
        session.user.email = (token.email as string | null) ?? session.user.email ?? null;
      }

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
