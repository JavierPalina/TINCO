import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Tarea from '@/models/Tarea';

// --- PUT: Actualizar una tarea (ej. marcar como completada) ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await request.json();
    
    // Buscamos la tarea y nos aseguramos de que pertenezca al usuario logueado
    const tareaActualizada = await Tarea.findOneAndUpdate(
      { _id: params.id, vendedorAsignado: session.user.id },
      body,
      { new: true, runValidators: true }
    );

    if (!tareaActualizada) {
      return NextResponse.json({ success: false, error: 'Tarea no encontrada o no tienes permiso' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: tareaActualizada });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- DELETE: Eliminar una tarea ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await dbConnect();

    try {
        const tareaEliminada = await Tarea.findOneAndDelete({ 
            _id: params.id, 
            vendedorAsignado: session.user.id 
        });

        if (!tareaEliminada) {
            return NextResponse.json({ success: false, error: 'Tarea no encontrada o no tienes permiso' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}