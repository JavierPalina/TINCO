import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EtapaCotizacion from '@/models/EtapaCotizacion';
import FormularioEtapa from '@/models/FormularioEtapa';

export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const { nombre, color, campos } = await request.json();

    const nuevaEtapa = await EtapaCotizacion.create({ nombre, color });

    let nuevoFormulario = null;
    if (campos && campos.length > 0) {
      nuevoFormulario = await FormularioEtapa.create({
        etapaId: nuevaEtapa._id,
        campos,
      });
    }

    return NextResponse.json({
      success: true,
      data: { etapa: nuevaEtapa, formulario: nuevoFormulario }
    }, { status: 201 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido.';
    console.error('Error del servidor:', errorMessage);

    if (error instanceof Error) {
        if (error.name === 'ValidationError') {
            return NextResponse.json({ success: false, error: 'Error de validación: ' + errorMessage }, { status: 400 });
        }
    }
    
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ success: false, error: 'Ya existe una etapa con este nombre.' }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Ocurrió un error inesperado.' }, { status: 500 });
  }
}