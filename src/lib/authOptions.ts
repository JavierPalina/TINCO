import { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";
import { ROLES, type UserRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: UserRole;
      image?: string | null;
      name?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    rol: UserRole;
    id: string;
    image?: string | null;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol: UserRole;
    id: string;
    image?: string | null;
    name?: string | null;
  }
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

        return {
          id: user._id.toString(),
          name: user.name ?? null,
          email: user.email,
          rol,
          image: (user as any).image ?? null,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Login inicial: "user" existe
      if (user) {
        token.id = (user as any).id ?? token.sub ?? "";
        token.rol = (user as any).rol;
        token.name = (user as any).name ?? token.name ?? null;
        token.image = (user as any).image ?? token.image ?? null;
      }

      // useSession().update({ name, image })
      if (trigger === "update") {
        const s = session as any;
        if (s?.name !== undefined) token.name = s.name;
        if (s?.image !== undefined) token.image = s.image;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.rol = token.rol as UserRole;

        session.user.name = (token.name as string) ?? session.user.name ?? null;
        session.user.image = (token.image as string) ?? session.user.image ?? null;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
