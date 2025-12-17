import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Cliente from "@/models/Cliente";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const searchTermRaw = (searchParams.get("searchTerm") || "").trim();
    const etapaRaw = (searchParams.get("etapa") || "").trim();
    const prioridadRaw = (searchParams.get("prioridad") || "").trim();

    const matchFilter: Record<string, any> = {};

    // --- Search ---
    if (searchTermRaw) {
      const safeTerm = escapeRegex(searchTermRaw);
      const searchRegex = new RegExp(`^${safeTerm}`, "i");

      matchFilter.$or = [
        { nombreCompleto: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { telefono: { $regex: searchRegex } },
        { empresa: { $regex: searchRegex } },
      ];
    }

    // --- Etapa (case-insensitive exact match) ---
    if (etapaRaw) {
      const safeEtapa = escapeRegex(etapaRaw);
      matchFilter.etapa = { $regex: new RegExp(`^${safeEtapa}$`, "i") };
    }

    // --- Prioridad (case-insensitive exact match) ---
    if (prioridadRaw) {
      const safePrioridad = escapeRegex(prioridadRaw);
      matchFilter.prioridad = { $regex: new RegExp(`^${safePrioridad}$`, "i") };
    }

    const clientes = await Cliente.aggregate([
      { $match: matchFilter },
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
      {
        $project: {
          nombreCompleto: 1,
          email: 1,
          telefono: 1,
          etapa: 1,
          prioridad: 1,
          origenContacto: 1,
          empresa: 1,
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
      { $sort: { createdAt: -1 } },
    ]);

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
    const clienteData = {
      ...body,
      vendedorAsignado: session.user.id,
    };

    const cliente = await Cliente.create(clienteData);

    return NextResponse.json({ success: true, data: cliente }, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
