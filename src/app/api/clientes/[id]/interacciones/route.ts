import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Interaccion from '@/models/Interaccion';
import User from '@/models/User';
import Cliente from '@/models/Cliente';

// --- La función GET no necesita cambios ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await dbConnect();
  try {
    const interacciones = await Interaccion.find({ cliente: id })
      .populate('usuario', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: interacciones });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- POST con validación y manejo de errores mejorado ---
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  await dbConnect();
  try {
    const { id } = params;
    const body = await request.json();
    const { tipo, nota, usuario } = body;

    // 1. Verificaciones explícitas de los datos requeridos
    if (!id || !usuario || !tipo || !nota) {
        return NextResponse.json({ success: false, error: "Faltan datos requeridos (cliente, usuario, tipo o nota)." }, { status: 400 });
    }

    const nuevaInteraccion = await Interaccion.create({
      cliente: id,
      usuario: usuario,
      tipo: tipo,
      nota: nota,
    });

    return NextResponse.json({ success: true, data: nuevaInteraccion }, { status: 201 });
  } catch (error: any) {
    // 2. Devolvemos el mensaje de error específico de la base de datos
    console.error("Error al crear interacción:", error);
    const errorMessage = error.errors 
      ? Object.values(error.errors).map((e: any) => e.message).join(', ') 
      : 'Error desconocido al guardar en la base de datos.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}