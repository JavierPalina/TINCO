import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Nota from '@/models/Nota';
import User from '@/models/User';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  const { id } = await params;
  await dbConnect();
  try {
    void User;

    const notas = await Nota.find({ cliente: id })
      .populate('usuario', 'name')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ success: true, data: notas });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error del servidor';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("--- INICIANDO POST /api/notas ---");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("Error: No autorizado (sin sesión)");
    return new NextResponse('No autorizado', { status: 401 });
  }
  console.log("Sesión de usuario encontrada:", session.user);

  await dbConnect();

  try {
    const { id } = await params;
    console.log("1. ID de Cliente recibido de la URL:", id);
    if (!id) {
      return NextResponse.json({ success: false, error: 'El ID del cliente es requerido en la URL' }, { status: 400 });
    }

    const body = await request.json();
    console.log("2. Cuerpo (body) de la petición recibido:", body);

    const { contenido } = body;
    if (!contenido) {
      return NextResponse.json({ success: false, error: 'El contenido de la nota es obligatorio' }, { status: 400 });
    }

    const datosParaGuardar = {
      cliente: id,
      usuario: session.user.id,
      contenido,
    };
    console.log("3. Datos que se intentarán guardar en la DB:", datosParaGuardar);

    const nuevaNota = await Nota.create(datosParaGuardar);
    console.log("4. Nota creada exitosamente en la DB:", nuevaNota);
    
    return NextResponse.json({ success: true, data: nuevaNota }, { status: 201 });

  } catch (error: unknown) {
    console.error("--- ERROR AL CREAR LA NOTA ---", error);

    let errorMessage = "Error desconocido";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "errors" in error
    ) {
      const validationErr = error as { errors: Record<string, { message: string }> };
      errorMessage = Object.values(validationErr.errors)
        .map((e) => e.message)
        .join(", ");
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}