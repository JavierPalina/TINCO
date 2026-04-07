// src/app/api/etapas-cotizacion/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EtapaCotizacion from '@/models/EtapaCotizacion';

function inferSystemKeyFromName(nombre: string) {
  const normalized = nombre.trim().toLowerCase();

  if (normalized === "proyecto por iniciar") return "proyecto_por_iniciar";
  if (normalized === "proyectos no realizados") return "proyectos_no_realizados";
  if (normalized === "proyecto finalizado") return "proyecto_finalizado";
  return null;
}

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
    const nombre =
      typeof body?.nombre === "string" ? body.nombre.trim() : "";

    const nuevaEtapa = await EtapaCotizacion.create({
      ...body,
      nombre,
      systemKey:
        typeof body?.systemKey === "string" && body.systemKey.trim()
          ? body.systemKey.trim()
          : inferSystemKeyFromName(nombre),
    });
    return NextResponse.json({ success: true, data: nuevaEtapa }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error al crear la etapa' }, { status: 400 });
  }
}
