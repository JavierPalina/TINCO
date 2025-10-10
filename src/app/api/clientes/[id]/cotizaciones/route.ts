// app/api/clientes/[id]/cotizaciones/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cotizacion from '@/models/Cotizacion';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import EtapaCotizacion from '@/models/EtapaCotizacion';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse('No autorizado', { status: 401 });
  }
  await dbConnect();

  try {
    const { id: clienteId } = await params;

    if (!clienteId) {
      return NextResponse.json({ success: false, error: 'El ID del cliente es requerido' }, { status: 400 });
    }

    const cotizaciones = await Cotizacion.find({ cliente: clienteId })
      .populate('etapa', 'nombre color')
      .populate('historialEtapas.etapa', 'nombre color')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: cotizaciones });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    // Devuelve el error real para un mejor diagnóstico en desarrollo
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}