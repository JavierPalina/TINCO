import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EtapaCotizacion from '@/models/EtapaCotizacion';

export async function GET() {
  await dbConnect();
  try {
    const etapas = await EtapaCotizacion.find({});
    return NextResponse.json({ success: true, data: etapas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const body = await request.json();
    const nuevaEtapa = await EtapaCotizacion.create(body);
    return NextResponse.json({ success: true, data: nuevaEtapa }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al crear la etapa' }, { status: 400 });
  }
}