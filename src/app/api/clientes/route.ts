import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('searchTerm');
    const etapa = searchParams.get('etapa');
    const prioridad = searchParams.get('prioridad');

    // Construimos el objeto de filtro para MongoDB
    const matchFilter: any = {};
    if (searchTerm) {
      // Usamos un ancla (^) para que la búsqueda sea "empieza con"
      const searchRegex = new RegExp(`^${searchTerm}`, 'i');
      
      matchFilter.$or = [
        { nombreCompleto: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { telefono: { $regex: searchRegex } },
        { empresa: { $regex: searchRegex } },
      ];
    }
    if (etapa) {
      matchFilter.etapa = etapa;
    }
    if (prioridad) {
      matchFilter.prioridad = prioridad;
    }
    const clientes = await Cliente.aggregate([
      { $match: matchFilter },
      // --- THIS IS THE KEY CHANGE ---
      // 1. Join with the 'users' collection to get the creator's data
      {
        $lookup: {
          from: 'users',
          localField: 'vendedorAsignado',
          foreignField: '_id',
          as: 'creadorInfo',
        },
      },
      // ... (The other lookups and addFields for interactions/quotes remain the same)
      { $lookup: { from: 'interaccions', localField: '_id', foreignField: 'cliente', as: 'interacciones' } },
      { $lookup: { from: 'cotizacions', localField: '_id', foreignField: 'cliente', as: 'cotizaciones' } },
      {
        $addFields: {
          ultimaInteraccion: { $arrayElemAt: [ "$interacciones", -1 ] },
          ultimaCotizacion: { $arrayElemAt: [ "$cotizaciones", -1 ] },
          // Get the creator's name from the joined data
          creadoPor: { $arrayElemAt: [ "$creadorInfo.name", 0 ] },
        },
      },
      // 2. Add 'direccion' to the fields we want to keep
      {
        $project: {
          // --- ESTA ES LA LISTA COMPLETA Y CORREGIDA ---
          nombreCompleto: 1,
          email: 1,
          telefono: 1,
          etapa: 1,
          prioridad: 1,
          origenContacto: 1,
          empresa: 1,
          vendedorAsignado: 1,
          createdAt: 1,
          
          // Campos de dirección personal
          direccion: 1,
          ciudad: 1,
          pais: 1,
          dni: 1,
          
          // Campos de empresa
          direccionEmpresa: 1,
          ciudadEmpresa: 1,
          paisEmpresa: 1,
          razonSocial: 1,
          contactoEmpresa: 1,
          cuil: 1,
          
          // Campos calculados
          creadoPor: 1,
          ultimoContacto: "$ultimaInteraccion.createdAt", // Simplificado para devolver solo la fecha
          ultimaCotizacionMonto: "$ultimaCotizacion.montoTotal",
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    
    return NextResponse.json({ success: true, data: clientes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

export async function POST(request: Request) {
  await dbConnect();
  try {
    const body = await request.json();
    const cliente = await Cliente.create(body);
    
    return NextResponse.json({ success: true, data: cliente }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}