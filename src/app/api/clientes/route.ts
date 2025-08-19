import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const clientes = await Cliente.aggregate([
      {
        $lookup: {
          from: 'interaccions',
          localField: '_id',
          foreignField: 'cliente',
          as: 'interacciones',
        },
      },
      {
        $addFields: {
          ultimoContacto: { $max: '$interacciones.createdAt' },
        },
      },
      {
        $project: {
          interacciones: 0,
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