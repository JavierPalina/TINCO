import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Cotizacion from '@/models/Cotizacion';

// --- GET: Obtener una cotización específica por su ID ---
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // <-- MODIFICADO
) {
  const { id } = await params; // <-- MODIFICADO: Se añade await
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const cotizacion = await Cotizacion.findById(id) // Se usa el 'id' resuelto
      .populate('cliente', 'nombreCompleto email telefono')
      .populate('vendedor', 'name email');

    if (!cotizacion) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cotizacion });
  } catch {
    return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
  }
}

// --- PUT: Actualizar una cotización ---
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- MODIFICADO
) {
  const { id } = await params; // <-- MODIFICADO: Se añade await
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const body = await request.json();
    const { etapa: nuevaEtapaId } = body;

    const cotizacionActualizada = await Cotizacion.findByIdAndUpdate(
      id, // Se usa el 'id' resuelto
      { 
        $set: { etapa: nuevaEtapaId },
        $push: { historialEtapas: { etapa: nuevaEtapaId, fecha: new Date() } } 
      },
      { new: true }
    );

    if (!cotizacionActualizada) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cotizacionActualizada });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- DELETE: Eliminar una cotización ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- MODIFICADO
) {
  const { id } = await params; // <-- MODIFICADO: Se añade await
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const cotizacionEliminada = await Cotizacion.findByIdAndDelete(id); // Se usa el 'id' resuelto
    if (!cotizacionEliminada) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}