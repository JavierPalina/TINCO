import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';
import Tarea from '@/models/Tarea';
import Cotizacion from '@/models/Cotizacion';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await dbConnect();

  try {
    const userId = session.user.id;
    const now = new Date();
    const tareasHoy = await Tarea.countDocuments({
      vendedorAsignado: userId,
      completada: false,
      fechaVencimiento: {
        $gte: startOfDay(now),
        $lte: endOfDay(now),
      },
    });

    const nuevosClientesMes = await Cliente.countDocuments({
      createdAt: {
        $gte: startOfMonth(now),
        $lte: endOfMonth(now),
      },
    });

    const cotizacionesStats = await Cotizacion.aggregate([
      {
        $group: {
          _id: null,
          totalCotizado: { $sum: '$montoTotal' },
          totalGanado: {
            $sum: {
              $cond: [{ $eq: ['$estado', 'Aceptada'] }, '$montoTotal', 0],
            },
          },
        },
      },
    ]);

    const motivosRechazo = await Cliente.aggregate([
      { $match: { etapa: 'Perdido', motivoRechazo: { $ne: null } } },
      {
        $group: {
          _id: '$motivoRechazo',
          count: { $sum: 1 },
        },
      },
      { $project: { name: '$_id', value: '$count', _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    const stats = {
      tareasHoy,
      nuevosClientesMes,
      totalCotizado: cotizacionesStats[0]?.totalCotizado || 0,
      totalGanado: cotizacionesStats[0]?.totalGanado || 0,
      motivosRechazo,
    };

    return NextResponse.json({ success: true, data: stats });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error del servidor';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}