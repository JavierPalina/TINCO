import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Nota from '@/models/Nota';
import User from '@/models/User';

// --- GET: Obtener todas las notas de un cliente ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    void User; // asegura que el modelo esté cargado, sin warning

    const notas = await Nota.find({ cliente: params.id })
      .populate('usuario', 'name')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ success: true, data: notas });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error del servidor';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("--- INICIANDO POST /api/notas ---");

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("Error: No autorizado (sin sesión)");
    return new NextResponse('No autorizado', { status: 401 });
  }
  console.log("Sesión de usuario encontrada:", session.user);

  await dbConnect();

  try {
    const { id } = params;
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
