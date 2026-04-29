import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Cliente from "@/models/Cliente";
import Tarea from "@/models/Tarea";
import Cotizacion from "@/models/Cotizacion";
import Proyecto from "@/models/Proyecto";
import "@/models/EtapaCotizacion";
import "@/models/User";
import {
  startOfMonth, endOfMonth, startOfDay, endOfDay,
  subMonths, format, startOfYear,
} from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await dbConnect();

  try {
    const now = new Date();
    const userId = session.user.id;
    const inicioAnio = startOfYear(now);

    // ── 1. KPIs básicos ────────────────────────────────────────────────────
    const [
      totalClientes,
      clientesMes,
      tareasHoy,
      tareasVencidas,
      proyectosActivos,
    ] = await Promise.all([
      Cliente.countDocuments(),
      Cliente.countDocuments({ createdAt: { $gte: startOfMonth(now), $lte: endOfMonth(now) } }),
      Tarea.countDocuments({
        vendedorAsignado: userId,
        completada: false,
        fechaVencimiento: { $gte: startOfDay(now), $lte: endOfDay(now) },
      }),
      Tarea.countDocuments({
        vendedorAsignado: userId,
        completada: false,
        fechaVencimiento: { $lt: startOfDay(now) },
      }),
      Proyecto.countDocuments({
        estadoActual: { $nin: ["Completado", "Rechazado", null] },
      }),
    ]);

    // ── 2. Stats cotizaciones globales ─────────────────────────────────────
    const cotStats = await Cotizacion.aggregate([
      {
        $group: {
          _id: null,
          totalCotizado: { $sum: "$montoTotal" },
          totalGanado: {
            $sum: { $cond: [{ $eq: ["$etapa", "Aceptada"] }, "$montoTotal", 0] },
          },
          count: { $sum: 1 },
        },
      },
    ]);
    const totalCotizado = cotStats[0]?.totalCotizado ?? 0;
    const totalGanado = cotStats[0]?.totalGanado ?? 0;
    const totalCotizaciones = cotStats[0]?.count ?? 0;

    // ── 3. Cotizaciones por etapa ──────────────────────────────────────────
    const cotizacionesPorEtapa = await Cotizacion.aggregate([
      {
        $lookup: {
          from: "etapacotizacions",
          localField: "etapa",
          foreignField: "_id",
          as: "etapaInfo",
        },
      },
      { $unwind: { path: "$etapaInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$etapaInfo.nombre",
          count: { $sum: 1 },
          monto: { $sum: "$montoTotal" },
        },
      },
      { $project: { nombre: { $ifNull: ["$_id", "Sin etapa"] }, count: 1, monto: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // ── 4. Clientes por etapa (CRM pipeline) ──────────────────────────────
    const clientesPorEtapa = await Cliente.aggregate([
      { $group: { _id: "$etapa", count: { $sum: 1 } } },
      { $project: { etapa: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // ── 5. Tendencia mensual (últimos 6 meses) ─────────────────────────────
    const mesesAtras = 5;
    const tendenciaMensual = await Promise.all(
      Array.from({ length: mesesAtras + 1 }, (_, i) => {
        const mes = subMonths(now, mesesAtras - i);
        return Cotizacion.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfMonth(mes), $lte: endOfMonth(mes) },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$montoTotal" },
              cantidad: { $sum: 1 },
            },
          },
        ]).then(([res]) => ({
          mes: format(mes, "MMM yy", { locale: undefined }),
          total: res?.total ?? 0,
          cantidad: res?.cantidad ?? 0,
        }));
      })
    );

    // ── 6. Proyectos por estado ────────────────────────────────────────────
    const proyectosPorEstado = await Proyecto.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$estadoActual", "Sin estado"] },
          count: { $sum: 1 },
        },
      },
      { $project: { estado: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // ── 7. Motivos de rechazo ─────────────────────────────────────────────
    const motivosRechazo = await Cliente.aggregate([
      { $match: { etapa: "Perdido", motivoRechazo: { $ne: null } } },
      { $group: { _id: "$motivoRechazo", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } },
      { $sort: { value: -1 } },
    ]);

    // ── 8. Top vendedores ─────────────────────────────────────────────────
    const topVendedores = await Cotizacion.aggregate([
      {
        $lookup: { from: "users", localField: "vendedor", foreignField: "_id", as: "v" },
      },
      { $unwind: { path: "$v", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$vendedor",
          nombre: { $first: "$v.name" },
          total: { $sum: "$montoTotal" },
          cantidad: { $sum: 1 },
        },
      },
      { $project: { nombre: { $ifNull: ["$nombre", "Sin nombre"] }, total: 1, cantidad: 1, _id: 0 } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    // ── 9. Clientes nuevos por mes (últimos 6) ────────────────────────────
    const clientesPorMes = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const mes = subMonths(now, 5 - i);
        return Cliente.countDocuments({
          createdAt: { $gte: startOfMonth(mes), $lte: endOfMonth(mes) },
        }).then((count) => ({
          mes: format(mes, "MMM yy", { locale: undefined }),
          count,
        }));
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalClientes,
          clientesMes,
          tareasHoy,
          tareasVencidas,
          proyectosActivos,
          totalCotizado,
          totalGanado,
          totalCotizaciones,
          tasaConversion: totalCotizaciones > 0
            ? Math.round((totalGanado / totalCotizado) * 100)
            : 0,
        },
        tendenciaMensual,
        cotizacionesPorEtapa,
        clientesPorEtapa,
        proyectosPorEstado,
        motivosRechazo,
        topVendedores,
        clientesPorMes,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error del servidor";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
