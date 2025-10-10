import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";

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

    const clientesConVendedor = clientesParaImportar.map(cliente => ({
      ...cliente,
      vendedorAsignado: session.user.id,
      etapa: cliente.etapa || 'Nuevo',
      prioridad: cliente.prioridad || 'Media',
    }));

    const resultado = await Cliente.insertMany(clientesConVendedor, { ordered: false });

    return NextResponse.json({ success: true, message: `${resultado.length} clientes importados con éxito.` });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "writeErrors" in error &&
      "result" in error
    ) {
      const mongoError = error as { writeErrors: unknown[]; result: { nInserted: number } };
      const successfulCount = mongoError.result.nInserted;
      return NextResponse.json({
        success: true,
        message: `${successfulCount} clientes importados. Algunos registros fallaron (ej. duplicados).`,
      });
    }

    return NextResponse.json({ success: false, error: "Error en la importación masiva." }, { status: 500 });
  }
}
