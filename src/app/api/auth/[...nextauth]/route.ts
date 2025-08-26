import NextAuth, { User, Session } from "next-auth"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb"
import CredentialsProvider from "next-auth/providers/credentials"
import dbConnect from "@/lib/dbConnect"
import UserModel from "@/models/User"
import bcrypt from "bcrypt"
import { JWT } from "next-auth/jwt"

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // Esta función se llama cuando un usuario intenta iniciar sesión
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas")
        }

        await dbConnect()

        // Buscamos al usuario por su email
        const user = await UserModel.findOne({ email: credentials.email }).select("+password")

        if (!user || !user.password) {
          throw new Error("Usuario no encontrado")
        }

        // Comparamos la contraseña del formulario con la encriptada en la DB
        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordCorrect) {
          throw new Error("Contraseña incorrecta")
        }

        // Si todo es correcto, devolvemos el usuario (sin la contraseña)
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          rol: user.rol,
        }
      },
    }),
  ],
  // Usamos JWT para las sesiones
  session: {
    strategy: "jwt" as const,
  },
  // Callbacks para añadir información extra (como el rol) al token de sesión
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id
        token.rol = user.rol
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id
        session.user.rol = token.rol
      }
      return session
    },
  },
  pages: {
    signIn: "/login", // Le decimos a NextAuth dónde está nuestra página de login
  },
  secret: process.env.NEXTAUTH_SECRET, // Una clave secreta para firmar los tokens
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
