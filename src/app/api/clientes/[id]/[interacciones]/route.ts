import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Interaccion from '@/models/Interaccion';
import User from '@/models/User'; // Importante para el populate
import Cliente from '@/models/Cliente'; // Importante para verificar que el cliente existe

interface Params {
  clienteId: string;
}

// --- OBTENER todas las interacciones de un cliente específico ---
export async function GET(request: Request, context: { params: Params }) {
  const { clienteId } = context.params;
  await dbConnect();
  
  // Aseguramos que los modelos estén registrados
  User;
  Cliente;

  try {
    const interacciones = await Interaccion.find({ cliente: clienteId })
      .populate('usuario', 'nombre') // Traemos el nombre del usuario que hizo la interacción
      .sort({ createdAt: -1 }); // Ordenamos de la más reciente a la más antigua

    return NextResponse.json({ success: true, data: interacciones });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}


// --- AÑADIR una nueva interacción a un cliente específico ---
export async function POST(request: Request, context: { params: Params }) {
  const { clienteId } = context.params;
  await dbConnect();

  try {
    const body = await request.json();

    // Creamos la nueva interacción, combinando el clienteId de la URL
    // con los datos que vienen en el cuerpo de la petición (nota, tipo, usuario).
    const nuevaInteraccion = await Interaccion.create({
      ...body,
      cliente: clienteId,
    });

    return NextResponse.json({ success: true, data: nuevaInteraccion }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}