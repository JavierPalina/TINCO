import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { name, email, password } = await request.json();

    // 1. Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está en uso' }, { status: 400 });
    }

    // 2. Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Crear el nuevo usuario
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      rol: 'vendedor', // Por defecto, todos los nuevos registros son vendedores
    });

    return NextResponse.json({ message: 'Usuario creado con éxito', user }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}