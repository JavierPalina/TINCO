import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Empresa from "@/models/Empresa";
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
    const provinciaRaw = (searchParams.get("provincia") || "").trim();
    const categoriaIVARaw = (searchParams.get("categoriaIVA") || "").trim();

    const matchFilter: MatchFilter = {};

    if (searchTermRaw) {
      const safeTerm = escapeRegex(searchTermRaw);
      const searchRegex = new RegExp(`^${safeTerm}`, "i");

      matchFilter.$or = [
        { razonSocial: { $regex: searchRegex } },
        { nombreFantasia: { $regex: searchRegex } },
        { cuit: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { telefono: { $regex: searchRegex } },
        { localidad: { $regex: searchRegex } },
      ];
    }

    if (provinciaRaw) {
      const safe = escapeRegex(provinciaRaw);
      matchFilter.provincia = { $regex: new RegExp(`^${safe}$`, "i") };
    }

    if (categoriaIVARaw) {
      const safe = escapeRegex(categoriaIVARaw);
      matchFilter.categoriaIVA = { $regex: new RegExp(`^${safe}$`, "i") };
    }

    const empresas = await Empresa.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: "users",
          localField: "creadoPor",
          foreignField: "_id",
          as: "creadorInfo",
        },
      },
      {
        $addFields: {
          creadoPorNombre: { $arrayElemAt: ["$creadorInfo.name", 0] },
        },
      },
      {
        $project: {
          razonSocial: 1,
          nombreFantasia: 1,
          domicilio: 1,
          barrio: 1,
          localidad: 1,
          provincia: 1,
          codigoPostal: 1,
          pais: 1,
          telefono: 1,
          email: 1,
          cuit: 1,
          categoriaIVA: 1,
          inscriptoGanancias: 1,
          notas: 1,
          creadoPor: 1,
          creadoPorNombre: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json({ success: true, data: empresas });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
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

    const empresa = await Empresa.create({
      ...body,
      creadoPor: new mongoose.Types.ObjectId(session.user.id),
    });

    return NextResponse.json({ success: true, data: empresa }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
