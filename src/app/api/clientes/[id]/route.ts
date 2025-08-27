import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';

// --- GET ---
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await dbConnect();

  try {
    const cliente = await Cliente.findById(id).populate(
      'vendedorAsignado',
      'name email'
    );

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: cliente });
  } catch (error) {
    console.error('Error en GET /api/clientes/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// --- PUT ---
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await dbConnect();

  try {
    const body = await req.json();

    const clienteActualizado = await Cliente.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!clienteActualizado) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: clienteActualizado });
  } catch (error) {
    console.error('Error en PUT /api/clientes/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor o datos inválidos' },
      { status: 400 }
    );
  }
}

// --- DELETE ---
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  await dbConnect();

  try {
    const clienteEliminado = await Cliente.findByIdAndDelete(id);
    if (!clienteEliminado) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: { message: 'Cliente eliminado correctamente' },
    });
  } catch (error) {
    console.error('Error en DELETE /api/clientes/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
