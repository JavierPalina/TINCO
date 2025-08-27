import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Interaccion from '@/models/Interaccion';
import User from '@/models/User';
import Cliente from '@/models/Cliente';

// --- GET: OBTENER todas las interacciones de un cliente específico ---
// Esta es la función que faltaba o estaba incorrecta, causando el error 405.
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();

  try {
    const interacciones = await Interaccion.find({ cliente: id })
      .populate('usuario', 'name') // Usamos 'name' para ser consistentes
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: interacciones });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- POST: AÑADIR una nueva interacción a un cliente específico ---
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  await dbConnect();

  try {
    const body = await request.json();

    const nuevaInteraccion = await Interaccion.create({
      ...body,
      cliente: id,
    });

    return NextResponse.json({ success: true, data: nuevaInteraccion }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}