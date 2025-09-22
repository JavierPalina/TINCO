import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Cotizacion from '@/models/Cotizacion';
import Tarea from '@/models/Tarea';
import Cliente from '@/models/Cliente';
import { addDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import mongoose from 'mongoose';

// --- GET: Obtener todas las cotizaciones con filtros y datos populados ---
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    const vendedorId = searchParams.get('vendedorId');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const searchTerm = searchParams.get('searchTerm');

    const matchFilter: any = {};
    if (vendedorId) {
      matchFilter.vendedor = new mongoose.Types.ObjectId(vendedorId);
    }
    if (fechaDesde && fechaHasta) {
      matchFilter.createdAt = {
        $gte: startOfDay(parseISO(fechaDesde)),
        $lte: endOfDay(parseISO(fechaHasta)),
      };
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchFilter },
      { $sort: { createdAt: -1 } }, // Ordenar antes para que los lookups sean sobre datos ordenados
      // --- Lógica para popular el historial ---
      { $unwind: { path: "$historialEtapas", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'etapacotizacions',
          localField: 'historialEtapas.etapa',
          foreignField: '_id',
          as: 'historialEtapas.etapaInfo'
        }
      },
      { $unwind: { path: "$historialEtapas.etapaInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          doc: { "$first": "$$ROOT" },
          historialEtapas: { "$push": "$historialEtapas" }
        }
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: [ "$doc", { historialEtapas: "$historialEtapas" } ] }
        }
      },
      // --- Fin lógica de historial ---
      { $lookup: { from: 'clientes', localField: 'cliente', foreignField: '_id', as: 'clienteInfo' } },
      { $unwind: { path: "$clienteInfo", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'etapacotizacions', localField: 'etapa', foreignField: '_id', as: 'etapaInfo' } },
      { $unwind: { path: "$etapaInfo", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'vendedor', foreignField: '_id', as: 'vendedorInfo' } },
      { $unwind: { path: "$vendedorInfo", preserveNullAndEmptyArrays: true } },
      
      { $match: searchTerm ? { 'clienteInfo.nombreCompleto': { $regex: searchTerm, $options: 'i' } } : {} },

      {
  $project: {
    codigo: 1,
    montoTotal: 1,
    detalle: 1,
    archivos: 1,
    historialEtapas: {
      $map: {
        input: "$historialEtapas",
        as: "h",
        in: {
          etapa: {
            _id: "$$h.etapaInfo._id",
            nombre: "$$h.etapaInfo.nombre",
            color: "$$h.etapaInfo.color",
          },
          fecha: "$$h.fecha"
        }
      }
    },
    cliente: {
      _id: '$clienteInfo._id',
      nombreCompleto: '$clienteInfo.nombreCompleto',
      prioridad: '$clienteInfo.prioridad',
    },
    etapa: {
      _id: "$etapaInfo._id",
      nombre: "$etapaInfo.nombre",
      color: "$etapaInfo.color"
    },
    vendedor: {
      _id: '$vendedorInfo._id',
      name: '$vendedorInfo.name',
    },
    createdAt: 1,
  }
}
    ];

    const cotizaciones = await Cotizacion.aggregate(pipeline);

    return NextResponse.json({ success: true, data: cotizaciones });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage, status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const body = await request.json();
    const { cliente: clienteId, etapa: etapaId, montoTotal, detalle, archivos } = body;

    const ultimaCotizacion = await Cotizacion.findOne().sort({ createdAt: -1 });
    let nuevoCodigo = 'COT-001';
    if (ultimaCotizacion && ultimaCotizacion.codigo) {
      const ultimoNumero = parseInt(ultimaCotizacion.codigo.split('-')[1]);
      nuevoCodigo = `COT-${(ultimoNumero + 1).toString().padStart(3, '0')}`;
    }

    const nuevaCotizacion = await Cotizacion.create({
      cliente: clienteId,
      etapa: etapaId,
      montoTotal,
      detalle,
      archivos,
      vendedor: session.user.id,
      codigo: nuevoCodigo,
      historialEtapas: [{ etapa: etapaId, fecha: new Date() }],
    });

    const cliente = await Cliente.findById(clienteId);
    if (cliente) {
      await Tarea.create({
        titulo: `Contactar a ${cliente.nombreCompleto} (Cot. ${nuevoCodigo})`,
        cliente: clienteId,
        vendedorAsignado: session.user.id,
        fechaVencimiento: addDays(new Date(), 3),
      });
    }

    return NextResponse.json({ success: true, data: nuevaCotizacion }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}