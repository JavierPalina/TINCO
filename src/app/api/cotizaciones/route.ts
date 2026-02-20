// src/app/api/cotizaciones/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Cotizacion from "@/models/Cotizacion";
import Tarea from "@/models/Tarea";
import Cliente from "@/models/Cliente";
import { addDays, startOfDay, endOfDay, parseISO } from "date-fns";
import mongoose from "mongoose";
import EtapaCotizacion from "@/models/EtapaCotizacion";

// -------------------- GET --------------------
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const vendedorId = searchParams.get("vendedorId");
    const fechaDesde = searchParams.get("fechaDesde");
    const fechaHasta = searchParams.get("fechaHasta");
    const searchTerm = searchParams.get("searchTerm");
    const clienteId = searchParams.get("clienteId");
    const sucursalId = searchParams.get("sucursalId");
    const etapaId = searchParams.get("etapaId");

    const matchFilter: Record<string, unknown> = {};

    // filtros por IDs (si vienen)
    if (sucursalId) matchFilter.sucursalId = new mongoose.Types.ObjectId(sucursalId);
    if (etapaId) matchFilter.etapa = new mongoose.Types.ObjectId(etapaId);
    if (vendedorId) matchFilter.vendedor = new mongoose.Types.ObjectId(vendedorId);
    if (clienteId) matchFilter.cliente = new mongoose.Types.ObjectId(clienteId);

    // ✅ rango de fechas robusto: soporta solo desde, solo hasta, o ambos
    if (fechaDesde || fechaHasta) {
      const createdAt: Record<string, Date> = {};
      if (fechaDesde) createdAt.$gte = startOfDay(parseISO(fechaDesde));
      if (fechaHasta) createdAt.$lte = endOfDay(parseISO(fechaHasta));
      matchFilter.createdAt = createdAt;
    }

    const pipeline: mongoose.PipelineStage[] = [
      { $match: matchFilter },
      { $sort: { createdAt: -1 } },

      { $unwind: { path: "$historialEtapas", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "etapacotizacions",
          localField: "historialEtapas.etapa",
          foreignField: "_id",
          as: "historialEtapas.etapaInfo",
        },
      },
      {
        $unwind: {
          path: "$historialEtapas.etapaInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$_id",
          doc: { $first: "$$ROOT" },
          historialEtapas: { $push: "$historialEtapas" },
        },
      },
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$doc", { historialEtapas: "$historialEtapas" }] },
        },
      },

      { $lookup: { from: "clientes", localField: "cliente", foreignField: "_id", as: "clienteInfo" } },
      { $unwind: { path: "$clienteInfo", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "etapacotizacions", localField: "etapa", foreignField: "_id", as: "etapaInfo" } },
      { $unwind: { path: "$etapaInfo", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "users", localField: "vendedor", foreignField: "_id", as: "vendedorInfo" } },
      { $unwind: { path: "$vendedorInfo", preserveNullAndEmptyArrays: true } },

      // ✅ searchTerm ahora matchea cliente o código
      {
        $match: searchTerm
          ? {
              $or: [
                { "clienteInfo.nombreCompleto": { $regex: searchTerm, $options: "i" } },
                { codigo: { $regex: searchTerm, $options: "i" } },
              ],
            }
          : {},
      },

      {
        $project: {
          codigo: 1,
          montoTotal: 1,
          detalle: 1,
          archivos: 1,
          sucursalId: 1,
          tipoAbertura: 1,
          comoNosConocio: 1,

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
                fecha: "$$h.fecha",
                datosFormulario: "$$h.datosFormulario",
              },
            },
          },

          cliente: {
            _id: "$clienteInfo._id",
            nombreCompleto: "$clienteInfo.nombreCompleto",
            prioridad: "$clienteInfo.prioridad",
            telefono: "$clienteInfo.telefono",
          },

          etapa: {
            _id: "$etapaInfo._id",
            nombre: "$etapaInfo.nombre",
            color: "$etapaInfo.color",
          },

          vendedor: {
            _id: "$vendedorInfo._id",
            name: "$vendedorInfo.name",
          },

          createdAt: 1,
          updatedAt: 1,
        },
      },
    ];

    const cotizaciones = await Cotizacion.aggregate(pipeline);
    return NextResponse.json({ success: true, data: cotizaciones });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// -------------------- POST --------------------
type CreateCotizacionBody = {
  cliente: string;
  montoTotal?: number | string;
  etapa?: string;
  sucursalId: string;
  tipoAbertura?: string;
  comoNosConocio?: string;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const body = (await request.json()) as CreateCotizacionBody;

    const {
      cliente: clienteId,
      montoTotal,
      etapa: etapaDesdeFront,
      sucursalId,
      tipoAbertura,
      comoNosConocio,
    } = body;

    if (!clienteId) throw new Error("cliente es obligatorio");
    if (!sucursalId) throw new Error("sucursalId es obligatorio");

    let etapaId: mongoose.Types.ObjectId;

    if (etapaDesdeFront) {
      const etapaDoc = await EtapaCotizacion.findById(etapaDesdeFront).select("_id");
      if (!etapaDoc) throw new Error("La etapa inicial enviada no existe");
      etapaId = etapaDoc._id;
    } else {
      const etapaDoc =
        (await EtapaCotizacion.findOne({
          nombre: new RegExp("^contacto inicial$", "i"),
        }).select("_id")) ??
        (await EtapaCotizacion.findOne().sort({ createdAt: 1 }).select("_id"));

      if (!etapaDoc) throw new Error("No se encontró una etapa inicial. Creá al menos una etapa.");
      etapaId = etapaDoc._id;
    }

    const ultimaCotizacion = await Cotizacion.findOne().sort({ createdAt: -1 });
    let nuevoCodigo = "COT-001";
    if (ultimaCotizacion?.codigo) {
      const ultimoNumero = parseInt(ultimaCotizacion.codigo.split("-")[1], 10);
      nuevoCodigo = `COT-${(ultimoNumero + 1).toString().padStart(3, "0")}`;
    }

    const parsedMonto = typeof montoTotal === "number" ? montoTotal : Number(montoTotal ?? 0);
    const safeMonto = Number.isFinite(parsedMonto) ? parsedMonto : 0;

    const detalle = `Tipo de Abertura: ${tipoAbertura || "No especificado"}\n | Cómo nos conoció: ${
      comoNosConocio || "No especificado"
    }`;

    const nuevaCotizacion = await Cotizacion.create({
      cliente: clienteId,
      etapa: etapaId,
      montoTotal: safeMonto,
      detalle,

      // ✅ ObjectId garantizado (aunque Mongoose castee, acá queda explícito)
      sucursalId: new mongoose.Types.ObjectId(sucursalId),

      tipoAbertura: tipoAbertura || undefined,
      comoNosConocio: comoNosConocio || undefined,

      archivos: [],
      vendedor: session.user.id,
      codigo: nuevoCodigo,

      historialEtapas: [
        {
          etapa: etapaId,
          fecha: new Date(),
          datosFormulario: {
            __precioAnterior: 0,
            __precioNuevo: safeMonto,
          },
        },
      ],
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
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}