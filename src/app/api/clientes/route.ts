import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';
import User from '@/models/User'; // <--- ¡AÑADE ESTA LÍNEA!

// --- FUNCIÓN GET: Para obtener todos los clientes ---
export async function GET() {
  // Importar el modelo User aquí asegura que Mongoose lo tenga registrado
  // antes de que .populate() intente usarlo.
  User;

  await dbConnect();
  try {
    const clientes = await Cliente.find({}).populate('vendedorAsignado', 'nombre email');
    
    return NextResponse.json({ success: true, data: clientes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

// --- FUNCIÓN POST: Para crear un nuevo cliente ---
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