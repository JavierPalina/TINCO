// app/api/clientes/[id]/tareas/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Tarea from '@/models/Tarea';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- Añade Promise aquí también
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { id: clienteId } = await params;

    if (!clienteId) {
      // Esta validación ahora funcionará correctamente
      return NextResponse.json({ success: false, error: 'El ID del cliente es requerido' }, { status: 400 });
    }

    // Buscamos todas las tareas que coincidan con el ID del cliente
    const tareas = await Tarea.find({ cliente: clienteId })
      .sort({ fechaVencimiento: 1 }); // Ordenamos por fecha de vencimiento

    return NextResponse.json({ success: true, data: tareas });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}