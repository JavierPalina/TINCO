// src/app/api/cotizaciones/[id]/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cotizacion, { ICotizacion } from '@/models/Cotizacion';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
    await dbConnect();

    const { id } = context.params;
    const body = await request.json();
    const { etapa, historial } = body || {};

    console.log('[API] ➡️ Incoming body:', JSON.stringify(body));

    if (!ObjectId.isValid(id)) {
        console.warn('[API] ⚠️ Invalid Quote ID:', id);
        return NextResponse.json({ success: false, error: 'Invalid quote ID.' }, { status: 400 });
    }

    // Validamos y obtenemos el ObjectId de la etapa de destino
    let etapaObjectId: mongoose.Types.ObjectId;
    if (!etapa || !ObjectId.isValid(etapa)) {
        console.warn('[API] ⚠️ Invalid or missing target stage ID.');
        return NextResponse.json({ success: false, error: 'Target stage ID is invalid or missing.' }, { status: 400 });
    }
    etapaObjectId = new mongoose.Types.ObjectId(etapa);

    try {
        // Corregido: Obtenemos el documento y lo asertamos a ICotizacion.
        const cotizacion = await Cotizacion.findById(id) as ICotizacion;
        if (!cotizacion) {
            console.warn('[API] ⚠️ Quote not found:', id);
            return NextResponse.json({ success: false, error: 'Quote not found.' }, { status: 404 });
        }
        
        console.log('[API] 📦 Fetched document:', JSON.stringify(cotizacion.toObject()));

        // Creamos un objeto plano de los datos del historial
        const plainHistorial = historial === undefined ? {} : JSON.parse(JSON.stringify(historial));
        console.log('[API] 🛠️ Normalized history data:', JSON.stringify(plainHistorial));

        // Creamos el nuevo objeto de historial. Ahora 'etapa' no puede ser 'undefined'.
        const newHistItem = {
            etapa: etapaObjectId,
            fecha: new Date(),
            datosFormulario: plainHistorial,
        };
        console.log('[API] 📝 New history item:', JSON.stringify(newHistItem));

        // Actualizamos la etapa principal de la cotización
        cotizacion.etapa = etapaObjectId;
        
        // Agregamos el nuevo elemento al array y marcamos como modificado
        cotizacion.historialEtapas.push(newHistItem);
        cotizacion.markModified('historialEtapas');

        console.log('[API] 🔄 Updated array before save:', JSON.stringify(cotizacion.historialEtapas));

        await cotizacion.save();
        console.log('[API] ✅ Document saved successfully.');

        // Re-fetch el documento para confirmar el guardado
        const refreshed = await Cotizacion.findById(id).lean() as ICotizacion | null;
        console.log('[API] ✨ Final document from DB:', JSON.stringify(refreshed?.historialEtapas));

        return NextResponse.json({ success: true, data: refreshed });

    } catch (error) {
        console.error('[API] ❌ API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}