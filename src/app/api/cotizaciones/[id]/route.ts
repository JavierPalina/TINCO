import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Cotizacion from '@/models/Cotizacion';

// --- GET: Obtener TODAS las cotizaciones de un cliente ---
export async function GET(request: NextRequest, { params }: { params: { clienteId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const cotizaciones = await Cotizacion.find({ cliente: params.clienteId })
      .populate('vendedor', 'name')
      .sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: cotizaciones });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// --- POST: Crear una NUEVA cotización para un cliente ---
export async function POST(request: NextRequest, { params }: { params: { clienteId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  await dbConnect();
  try {
    const body = await request.json();

    const ultimaCotizacion = await Cotizacion.findOne().sort({ createdAt: -1 });
    let nuevoCodigo = 'COT-001';
    if (ultimaCotizacion && ultimaCotizacion.codigo) {
        const ultimoNumero = parseInt(ultimaCotizacion.codigo.split('-')[1]);
        nuevoCodigo = `COT-${(ultimoNumero + 1).toString().padStart(3, '0')}`;
    }

    const nuevaCotizacion = await Cotizacion.create({
      ...body,
      cliente: params.clienteId, // Usamos el parámetro correcto
      vendedor: session.user.id,
      codigo: nuevoCodigo,
    });

    return NextResponse.json({ success: true, data: nuevaCotizacion }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}