import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FormularioEtapa from '@/models/FormularioEtapa';
import { ObjectId } from 'mongodb';

// Endpoint para obtener un formulario por ID de etapa
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ etapaId: string }> }
) {
    await dbConnect();

    try {
        const { etapaId } = await params;
        
        if (!ObjectId.isValid(etapaId)) {
            return NextResponse.json(
                { success: false, error: 'ID de etapa de formulario inválido.' },
                { status: 400 }
            );
        }

        const formulario = await FormularioEtapa.findOne({ etapa: etapaId });

        if (!formulario) {
            return NextResponse.json({ success: true, data: null });
        }

        return NextResponse.json({ success: true, data: formulario });
    } catch (error: unknown) {
        console.error('Error en GET /api/formularios-etapa/[etapaId]:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
