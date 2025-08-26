import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const body = await request.json();
    const clientesParaImportar = body.clientes;

    if (!Array.isArray(clientesParaImportar) || clientesParaImportar.length === 0) {
      return NextResponse.json({ success: false, error: "No se proporcionaron clientes para importar." }, { status: 400 });
    }

    // Añadimos el vendedor asignado a cada cliente
    const clientesConVendedor = clientesParaImportar.map(cliente => ({
      ...cliente,
      vendedorAsignado: session.user.id,
      // Puedes añadir valores por defecto si faltan en el CSV
      etapa: cliente.etapa || 'Nuevo',
      prioridad: cliente.prioridad || 'Media',
    }));

    // Usamos insertMany para una inserción masiva y eficiente
    const resultado = await Cliente.insertMany(clientesConVendedor, { ordered: false });

    return NextResponse.json({ success: true, message: `${resultado.length} clientes importados con éxito.` });
  } catch (error: any) {
    // ordered: false permite que si un cliente falla (ej. duplicado), los otros se inserten.
    if (error.writeErrors) {
      const successfulCount = error.result.nInserted;
      return NextResponse.json({ success: true, message: `${successfulCount} clientes importados. Algunos registros fallaron (ej. duplicados).` });
    }
    return NextResponse.json({ success: false, error: "Error en la importación masiva." }, { status: 500 });
  }
}