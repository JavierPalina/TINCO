import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FormularioEtapa from '@/models/FormularioEtapa';

export async function GET(request: NextRequest, { params }: { params: { etapaId: string } }) {
  await dbConnect();
  try {
    const { etapaId } = params;
    const formulario = await FormularioEtapa.findOne({ etapaId });

    if (!formulario) {
      return NextResponse.json({ success: true, data: { campos: [] } });
    }

    return NextResponse.json({ success: true, data: formulario });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener el formulario de la etapa.';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}