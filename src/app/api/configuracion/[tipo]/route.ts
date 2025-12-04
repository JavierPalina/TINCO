// /app/api/configuracion/[tipo]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ConfigOpcion from '@/models/ConfigOpcion';
import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';

// --- GET: OBTENER OPCIONES POR TIPO ---
export async function GET(
  request: NextRequest,
  { params }: { params: { tipo: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const opciones = await ConfigOpcion.find({ tipo: params.tipo }).sort('valor');
    return NextResponse.json({ success: true, data: opciones });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error' }, { status: 500 });
  }
}

// --- POST: CREAR UNA NUEVA OPCIÓN ---
export async function POST(
  request: NextRequest,
  { params }: { params: { tipo: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const body = await request.json(); // { valor: 'Nuevo Color' }
    if (!body.valor) {
      return NextResponse.json({ success: false, error: 'El campo "valor" es requerido' }, { status: 400 });
    }

    const nuevaOpcion = await ConfigOpcion.create({
      tipo: params.tipo,
      valor: body.valor,
    });
    return NextResponse.json({ success: true, data: nuevaOpcion }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al crear la opción' }, { status: 400 });
  }
}