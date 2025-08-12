import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';

interface Params {
  id: string;
}

// --- FUNCIÓN GET (por ID): Para obtener un solo cliente ---
export async function GET(request: Request, context: { params: Params }) {
  const { id } = context.params;
  await dbConnect();

  try {
    const cliente = await Cliente.findById(id).populate('vendedorAsignado', 'nombre email');
    if (!cliente) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cliente });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'ID de cliente inválido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- FUNCIÓN PUT: Para actualizar un cliente ---
export async function PUT(request: Request, context: { params: Params }) {
    const params = context.params;
    const { id } = params;
    await dbConnect();

  try {
    const body = await request.json();
    // Buscamos y actualizamos el cliente. { new: true } devuelve el documento actualizado.
    const clienteActualizado = await Cliente.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!clienteActualizado) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: clienteActualizado });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}


// --- FUNCIÓN DELETE: Para eliminar un cliente ---
export async function DELETE(request: Request, context: { params: Params }) {
    const params = context.params;
    const { id } = params;
    await dbConnect();

  try {
    const clienteEliminado = await Cliente.findByIdAndDelete(id);
    if (!clienteEliminado) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    // Generalmente, en un DELETE exitoso no se devuelve contenido (status 204).
    // Pero para confirmar, podemos devolver un mensaje de éxito.
    return NextResponse.json({ success: true, data: { message: "Cliente eliminado correctamente" } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}