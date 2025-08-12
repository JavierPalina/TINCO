import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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

    // 1. Tareas pendientes para hoy
    const tareasHoy = await Tarea.countDocuments({
      vendedorAsignado: userId,
      completada: false,
      fechaVencimiento: {
        $gte: startOfDay(now),
        $lte: endOfDay(now),
      },
    });

    // 2. Nuevos clientes este mes
    const nuevosClientesMes = await Cliente.countDocuments({
      // Si quieres que sea solo para el vendedor, añade: vendedorAsignado: userId,
      createdAt: {
        $gte: startOfMonth(now),
        $lte: endOfMonth(now),
      },
    });

    // 3. Total cotizado vs. total ganado (usando agregación)
    const cotizacionesStats = await Cotizacion.aggregate([
      // Opcional: Descomenta para filtrar solo por el vendedor logueado
      // { $match: { vendedor: new mongoose.Types.ObjectId(userId) } },
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

    // 4. Gráfico de Motivos de Rechazo (usando agregación)
    const motivosRechazo = await Cliente.aggregate([
      { $match: { etapa: 'Perdido', motivoRechazo: { $ne: null } } },
      {
        $group: {
          _id: '$motivoRechazo',
          count: { $sum: 1 },
        },
      },
      { $project: { name: '$_id', value: '$count', _id: 0 } }, // Formatear para la librería de gráficos
      { $sort: { value: -1 } },
    ]);

    // Consolidamos los resultados
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