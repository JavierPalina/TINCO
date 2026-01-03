import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { ROLES } from "@/lib/roles";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { name, email, password, rol } = await request.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const finalRole =
      typeof rol === "string" && (ROLES as readonly string[]).includes(rol)
        ? rol
        : "vendedor";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      rol: finalRole,
    });

    return NextResponse.json({ message: "Usuario creado con éxito", user }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
