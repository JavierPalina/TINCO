import { NextRequest, NextResponse } from 'next/server'; // Importar NextRequest
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Tarea from '@/models/Tarea';

export async function GET(request: NextRequest) { // Usar NextRequest para acceder a la URL
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await dbConnect();

  // 1. Construir el filtro de la consulta
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  const queryFilter: { vendedorAsignado: string; cliente?: string } = {
    vendedorAsignado: session.user.id,
  };

  if (clientId) {
    queryFilter.cliente = clientId; // 2. Si se provee un clientId, se añade al filtro
  }

  try {
    const tareas = await Tarea.find(queryFilter)
      .populate('cliente', 'nombreCompleto')
      .sort({ fechaVencimiento: 1 });

    return NextResponse.json({ success: true, data: tareas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// --- POST: Crear una nueva tarea ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await request.json();

    // Creamos la tarea, asignando automáticamente el ID del vendedor logueado
    const nuevaTarea = await Tarea.create({
      ...body,
      vendedorAsignado: session.user.id,
    });

    return NextResponse.json({ success: true, data: nuevaTarea }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}