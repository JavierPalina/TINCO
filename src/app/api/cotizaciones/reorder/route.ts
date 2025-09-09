import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Cotizacion from '@/models/Cotizacion'; // Ajusta la ruta a tu modelo
import { Types } from 'mongoose';

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        await dbConnect();
        
        const { stageId, orderedQuoteIds } = await request.json();

        if (!stageId || !Array.isArray(orderedQuoteIds)) {
            return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 });
        }

        // Prepara una operación de actualización masiva (bulk write)
        const bulkOps = orderedQuoteIds.map((quoteId, index) => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(quoteId) },
                update: { $set: { orden: index } },
            },
        }));

        if (bulkOps.length > 0) {
            await Cotizacion.bulkWrite(bulkOps);
        }

        return NextResponse.json({ success: true, message: 'Orden actualizado correctamente' });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al reordenar cotizaciones:', error);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}