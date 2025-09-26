// /src/app/api/formularios-etapa/[etapaId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FormularioEtapa from '@/models/FormularioEtapa';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, context: any) {
  await dbConnect();

  try {
    const { etapaId } = context.params;

    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: 'ID de etapa de formulario inválido.' },
        { status: 400 }
      );
    }

    const formulario = await FormularioEtapa.findOne({ etapaId });

    if (!formulario) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: formulario });
  } catch (error: unknown) {
    console.error('Error en GET /api/formularios-etapa/[etapaId]:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}