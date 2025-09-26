// /src/app/api/formularios-etapa/[etapaId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FormularioEtapa from '@/models/FormularioEtapa';
import mongoose from 'mongoose';

// Endpoint para obtener un formulario por ID de etapa
export async function GET(
  req: NextRequest,
  // ✅ CORRECCIÓN: Usamos 'context' (o cualquier nombre) para el segundo argumento
  context: { params: { etapaId: string } } 
) {
  await dbConnect();

  try {
    // Acceso al parámetro a través del contexto
    const { etapaId } = context.params;

    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: 'ID de etapa de formulario inválido.' },
        { status: 400 }
      );
    }

    // 🚨 Importante: Aquí debes usar 'etapaId' si ese es el nombre del campo en tu modelo FormularioEtapa.
    const formulario = await FormularioEtapa.findOne({ etapaId: etapaId });

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