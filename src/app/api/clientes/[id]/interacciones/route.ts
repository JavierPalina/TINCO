import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Interaccion from '@/models/Interaccion';
import mongoose from 'mongoose';

/**
 * Defines the expected shape of a Mongoose validation error value.
 * This helps avoid using the 'any' type.
 */
interface MongooseErrorValue {
  message: string;
}

// --- GET: Obtener todas las interacciones de un cliente ---
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Destructure the id from the params object
  const { id } = params;
  
  await dbConnect();

  try {
    const interacciones = await Interaccion.find({ cliente: id })
      .populate('usuario', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: interacciones });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- POST: Añadir una nueva interacción ---
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  await dbConnect();

  try {
    // Destructure the id from the params object
    const { id } = params;
    const body = await request.json();
    const { tipo, nota } = body;

    if (!id || !tipo || !nota) {
      return NextResponse.json(
        { success: false, error: "Faltan datos requeridos (cliente, tipo o nota)." },
        { status: 400 }
      );
    }

    const nuevaInteraccion = await Interaccion.create({
      cliente: id,
      usuario: session.user.id,
      tipo,
      nota,
    });

    return NextResponse.json({ success: true, data: nuevaInteraccion }, { status: 201 });
  } catch (error: unknown) {
    let errorMessage = "Error al guardar en la base de datos.";
    // Handle Mongoose validation errors specifically
    if (error instanceof mongoose.Error.ValidationError) {
      errorMessage = Object.values(error.errors)
        .map((e: MongooseErrorValue) => e.message)
        .join(", ");
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}