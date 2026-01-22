import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Cotizacion from '@/models/Cotizacion';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const cotizacion = await Cotizacion.findById(id)
      .populate('cliente')
      .populate('vendedor', 'name email')
      .populate("etapa", "nombre color")
      .populate("historialEtapas.etapa", "nombre color");

    if (!cotizacion) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cotizacion });
  } catch {
    return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const body = await request.json();
    const { etapa: nuevaEtapaId } = body;

    const cotizacionActualizada = await Cotizacion.findByIdAndUpdate(
      id,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const cotizacionEliminada = await Cotizacion.findByIdAndDelete(id);
    if (!cotizacionEliminada) {
      return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}