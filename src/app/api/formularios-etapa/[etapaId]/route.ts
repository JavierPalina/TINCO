// /src/app/api/formularios-etapa/[etapaId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FormularioEtapa from '@/models/FormularioEtapa';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  context: { params: { etapaId: string } }
) {
  await dbConnect();

  try {
    const { etapaId } = context.params;

    console.log(`API DEBUG: Recibida etapaId: ${etapaId}`);

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
    const errorMessage =
      error instanceof Error ? error.message : 'Error interno del servidor.';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
