import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cotizacion, { ICotizacion } from '@/models/Cotizacion';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { etapa, historial } = body || {};

    console.log('[API] ➡️ Incoming body:', JSON.stringify(body));

    if (!ObjectId.isValid(id)) {
        console.warn('[API] ⚠️ Invalid Quote ID:', id);
        return NextResponse.json({ success: false, error: 'Invalid quote ID.' }, { status: 400 });
    }

    if (!etapa || !ObjectId.isValid(etapa)) {
        console.warn('[API] ⚠️ Invalid or missing target stage ID.');
        return NextResponse.json({ success: false, error: 'Target stage ID is invalid or missing.' }, { status: 400 });
    }
    const etapaObjectId = new mongoose.Types.ObjectId(etapa);

    try {
        const cotizacion = await Cotizacion.findById(id) as ICotizacion;
        if (!cotizacion) {
            console.warn('[API] ⚠️ Quote not found:', id);
            return NextResponse.json({ success: false, error: 'Quote not found.' }, { status: 404 });
        }
        
        console.log('[API] 📦 Fetched document:', JSON.stringify(cotizacion.toObject()));

        const plainHistorial = historial === undefined ? {} : JSON.parse(JSON.stringify(historial));
        console.log('[API] 🛠️ Normalized history data:', JSON.stringify(plainHistorial));

        const newHistItem = {
            etapa: etapaObjectId,
            fecha: new Date(),
            datosFormulario: plainHistorial,
        };
        console.log('[API] 📝 New history item:', JSON.stringify(newHistItem));

        cotizacion.etapa = etapaObjectId;
        
        cotizacion.historialEtapas.push(newHistItem);
        cotizacion.markModified('historialEtapas');

        console.log('[API] 🔄 Updated array before save:', JSON.stringify(cotizacion.historialEtapas));

        await cotizacion.save();
        console.log('[API] ✅ Document saved successfully.');

        const refreshed = await Cotizacion.findById(id).lean() as ICotizacion | null;
        console.log('[API] ✨ Final document from DB:', JSON.stringify(refreshed?.historialEtapas));

        return NextResponse.json({ success: true, data: refreshed });

    } catch (error) {
        console.error('[API] ❌ API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}