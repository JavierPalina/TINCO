// src/app/api/create-user/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ROLES, type UserRole } from "@/lib/roles";

const CreateUserSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  rol: z
    .string()
    .optional()
    .transform((v) => (v ? v.trim() : "vendedor"))
    .refine((v) => (ROLES as readonly string[]).includes(v), "Rol inválido"),

  personalData: z.any().optional(),
  contactData: z.any().optional(),
  laboralData: z.any().optional(),
  financieraLegalData: z.any().optional(),
});

export async function POST(request: NextRequest) {
  // ✅ recomendado: solo admin/gerente pueden crear usuarios
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const rolSesion = session.user?.rol as UserRole | undefined;
  if (rolSesion !== "admin" && rolSesion !== "gerente") {
    return NextResponse.json(
      { success: false, error: "No tenés permisos para crear usuarios" },
      { status: 403 }
    );
  }

  await dbConnect();

  try {
    const raw = await request.json();
    const parsed = CreateUserSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      rol,
      personalData,
      contactData,
      laboralData,
      financieraLegalData,
    } = parsed.data;

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "El email ya está en uso" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      rol,
      activo: true,
      personalData,
      contactData,
      laboralData,
      financieraLegalData,
    });

    // ⚠️ no devolver password
    const safeUser = await User.findById(user._id).select("_id name email rol activo");

    return NextResponse.json(
      { success: true, message: "Usuario creado con éxito", data: safeUser },
      { status: 201 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
