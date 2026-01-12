import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Cliente from "@/models/Cliente";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import mongoose from "mongoose";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type MatchFilter = Record<string, unknown> & {
  $or?: Array<Record<string, unknown>>;
};

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const searchTermRaw = (searchParams.get("searchTerm") || "").trim();
    const etapaRaw = (searchParams.get("etapa") || "").trim();
    const prioridadRaw = (searchParams.get("prioridad") || "").trim();
    const empresaIdRaw = (searchParams.get("empresaId") || "").trim();

    const matchFilter: MatchFilter = {};

    // Filtro por empresa asignada
    if (empresaIdRaw && mongoose.Types.ObjectId.isValid(empresaIdRaw)) {
      matchFilter.empresaAsignada = new mongoose.Types.ObjectId(empresaIdRaw);
    }

    // Etapa
    if (etapaRaw) {
      const safeEtapa = escapeRegex(etapaRaw);
      matchFilter.etapa = { $regex: new RegExp(`^${safeEtapa}$`, "i") };
    }

    // Prioridad
    if (prioridadRaw) {
      const safePrioridad = escapeRegex(prioridadRaw);
      matchFilter.prioridad = { $regex: new RegExp(`^${safePrioridad}$`, "i") };
    }

    // Armamos pipeline con lookups (incluye empresas)
    const pipeline: any[] = [
      { $match: matchFilter },

      // Empresa asignada
      {
        $lookup: {
          from: "empresas",
          localField: "empresaAsignada",
          foreignField: "_id",
          as: "empresaInfo",
        },
      },
      {
        $addFields: {
          empresaNombre: { $arrayElemAt: ["$empresaInfo.razonSocial", 0] },
        },
      },

      // Lookups existentes
      {
        $lookup: {
          from: "users",
          localField: "vendedorAsignado",
          foreignField: "_id",
          as: "creadorInfo",
        },
      },
      {
        $lookup: {
          from: "interaccions",
          localField: "_id",
          foreignField: "cliente",
          as: "interacciones",
        },
      },
      {
        $lookup: {
          from: "cotizacions",
          localField: "_id",
          foreignField: "cliente",
          as: "cotizaciones",
        },
      },
      {
        $addFields: {
          ultimaInteraccion: { $arrayElemAt: ["$interacciones", -1] },
          ultimaCotizacion: { $arrayElemAt: ["$cotizaciones", -1] },
          creadoPor: { $arrayElemAt: ["$creadorInfo.name", 0] },
        },
      },
    ];

    // Búsqueda (después del lookup para permitir buscar por empresaNombre)
    if (searchTermRaw) {
      const safeTerm = escapeRegex(searchTermRaw);
      const searchRegex = new RegExp(`^${safeTerm}`, "i");

      pipeline.push({
        $match: {
          $or: [
            { nombreCompleto: { $regex: searchRegex } },
            { email: { $regex: searchRegex } },
            { telefono: { $regex: searchRegex } },

            // legacy
            { empresa: { $regex: searchRegex } },
            { razonSocial: { $regex: searchRegex } },

            // nuevo (de Empresa)
            { empresaNombre: { $regex: searchRegex } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $project: {
          nombreCompleto: 1,
          email: 1,
          telefono: 1,
          etapa: 1,
          prioridad: 1,
          origenContacto: 1,

          // legacy + nuevo
          empresa: 1,
          empresaAsignada: 1,
          empresaNombre: 1,

          vendedorAsignado: 1,
          createdAt: 1,
          direccion: 1,
          ciudad: 1,
          pais: 1,
          dni: 1,

          direccionEmpresa: 1,
          ciudadEmpresa: 1,
          paisEmpresa: 1,
          razonSocial: 1,
          contactoEmpresa: 1,
          cuil: 1,

          creadoPor: 1,
          ultimoContacto: "$ultimaInteraccion.createdAt",
          ultimaCotizacionMonto: "$ultimaCotizacion.montoTotal",
        },
      },
      { $sort: { createdAt: -1 } }
    );

    const clientes = await Cliente.aggregate(pipeline);

    return NextResponse.json({ success: true, data: clientes });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await request.json();

    // Si viene empresaAsignada como string, normalizamos a ObjectId
    const empresaAsignada =
      body.empresaAsignada && mongoose.Types.ObjectId.isValid(body.empresaAsignada)
        ? new mongoose.Types.ObjectId(body.empresaAsignada)
        : undefined;

    const clienteData = {
      ...body,
      empresaAsignada,
      vendedorAsignado: new mongoose.Types.ObjectId(session.user.id),
    };

    const cliente = await Cliente.create(clienteData);

    return NextResponse.json({ success: true, data: cliente }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
