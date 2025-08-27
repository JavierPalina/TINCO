import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';

// --- NUEVO ENFOQUE ---
// 1. Usamos el tipo `Request` nativo en lugar de `NextRequest`.
// 2. No desestructuramos el segundo argumento en la firma de la función.
//    Recibimos el objeto `context` completo y accedemos a `context.params` adentro.
// Esto presenta una estructura más simple para el compilador de TypeScript.

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
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
    // Agregamos un console.error para ver el error real en la consola del servidor
    console.error('Error en GET /api/clientes/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    );
  }
}

// --- FUNCIÓN PUT (con el mismo nuevo enfoque) ---
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  await dbConnect();

  try {
    const body = await request.json();

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
      { status: 400 } // Cambiado a 400 para errores de validación
    );
  }
}

// --- FUNCIÓN DELETE (con el mismo nuevo enfoque) ---
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
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
