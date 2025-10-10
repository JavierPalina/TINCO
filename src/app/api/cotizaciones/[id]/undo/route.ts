import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cotizacion from '@/models/Cotizacion';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid quote ID.' }, { status: 400 });
  }

  try {
    const cotizacion = await Cotizacion.findById(id);
    if (!cotizacion) {
      return NextResponse.json({ success: false, error: 'Quote not found.' }, { status: 404 });
    }

    // Necesitamos al menos 2 etapas en historial
    if (cotizacion.historialEtapas.length < 2) {
      return NextResponse.json({ success: false, error: 'No hay acciones para deshacer.' }, { status: 400 });
    }

    // Quitamos la última acción
    cotizacion.historialEtapas.pop();

    // Recuperamos la anterior
    const lastStage = cotizacion.historialEtapas[cotizacion.historialEtapas.length - 1];
    cotizacion.etapa = new mongoose.Types.ObjectId(lastStage.etapa);

    await cotizacion.save();

    const refreshed = await Cotizacion.findById(id).lean();

    return NextResponse.json({ success: true, data: refreshed });
  } catch (error) {
    console.error('Undo Error:', error);
    return NextResponse.json({ success: false, error: 'Error al deshacer la acción.' }, { status: 500 });
  }
}
