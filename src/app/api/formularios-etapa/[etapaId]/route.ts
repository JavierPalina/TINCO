// /src/app/api/formularios-etapa/[etapaId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import FormularioEtapa from '@/models/FormularioEtapa'; 
import mongoose from 'mongoose';

// Endpoint para obtener un formulario por ID de etapa
export async function GET(
    req: NextRequest,
    // ✅ CORRECCIÓN CLAVE: Firma de tipo estándar para el App Router
    { params }: { params: { etapaId: string } } 
) {
    await dbConnect();

    try {
        // ✅ CORRECCIÓN: Acceso directo a 'etapaId' sin 'await'
        const { etapaId } = params;
        
        console.log(`API DEBUG: Recibida etapaId: ${etapaId}`);

        // 1. Validar que la ID es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(etapaId)) {
            console.error(`API ERROR: ID de etapa inválida: ${etapaId}`);
            return NextResponse.json(
                { success: false, error: 'ID de etapa de formulario inválido.' },
                { status: 400 }
            );
        }

        // 2. Buscar el formulario
        const formulario = await FormularioEtapa.findOne({ etapaId: etapaId });

        if (!formulario) {
            console.log(`API LOG: No se encontró formulario asociado a la etapa ${etapaId}.`);
            return NextResponse.json({ success: true, data: null });
        }

        // 3. Devolver el formulario encontrado
        console.log(`API LOG: Formulario encontrado para etapa ${etapaId}. Devolviendo datos.`);
        return NextResponse.json({ success: true, data: formulario });
        
    } catch (error: unknown) {
        console.error('Error en GET /api/formularios-etapa/[etapaId]:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor.';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}