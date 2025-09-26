// /src/app/api/formularios-etapa/[etapaId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FormularioEtapa from '@/models/FormularioEtapa';
import mongoose from 'mongoose';

// Endpoint para obtener un formulario por ID de etapa
export async function GET(
  req: NextRequest,
  // ✅ SINTAXIS CORREGIDA: Utilizamos Promise<{ etapaId: string }> para satisfacer el compilador/runtime
  // Nota: La clave del parámetro debe coincidir con el nombre de la carpeta dinámica ([etapaId])
  { params }: { params: Promise<{ etapaId: string }> } 
) {
  await dbConnect();

  try {
    // ✅ MODIFICACIÓN CLAVE: Esperamos la resolución del objeto 'params'
    const { etapaId } = await params;

    // 1. Validar que la ID es un ObjectId válido
    // (Usamos 'etapaId' ya resuelto)
    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: 'ID de etapa de formulario inválido.' },
        { status: 400 }
      );
    }

    // 2. Buscar el formulario (Usamos 'etapaId' como clave de búsqueda, ya verificado que es el campo correcto)
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