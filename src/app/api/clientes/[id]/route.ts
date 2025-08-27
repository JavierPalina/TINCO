import { NextRequest, NextResponse } from 'next/server'; // Importar NextRequest
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';

// --- FUNCIÓN GET (por ID): Para obtener un solo cliente ---
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Se aplica el await aquí
  await dbConnect();

  try {
    const cliente = await Cliente.findById(id).populate('vendedorAsignado', 'name email');
    if (!cliente) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cliente });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'ID de cliente inválido' }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params; // ✅ sin await
  await dbConnect();

  try {
    const body = await request.json();
    const clienteActualizado = await Cliente.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!clienteActualizado) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: clienteActualizado });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- FUNCIÓN DELETE: Para eliminar un cliente ---
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Se aplica el await aquí
  await dbConnect();

  try {
    const clienteEliminado = await Cliente.findByIdAndDelete(id);
    if (!clienteEliminado) {
      return NextResponse.json({ success: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { message: "Cliente eliminado correctamente" } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}