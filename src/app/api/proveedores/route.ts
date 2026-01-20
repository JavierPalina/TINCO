import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Proveedor from "@/models/Proveedor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import mongoose from "mongoose";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type MatchFilter = Record<string, unknown> & {
  $or?: Array<Record<string, unknown>>;
  provincia?: unknown;
  categoriaIVA?: unknown;
  sucursal?: mongoose.Types.ObjectId;
};

function canFilterAnySucursal(rol?: string) {
  // Ajustá según tus roles reales
  return rol === "admin" || rol === "superadmin" || rol === "gerente";
}

type ProveedorCreateBody = Record<string, unknown> & {
  sucursal?: unknown;
  creadoPor?: unknown;
};

export async function GET(request: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const searchTermRaw = (searchParams.get("searchTerm") || "").trim();
    const provinciaRaw = (searchParams.get("provincia") || "").trim();
    const categoriaIVARaw = (searchParams.get("categoriaIVA") || "").trim();

    // ✅ sucursalId opcional (solo roles autorizados)
    const sucursalIdRaw = (searchParams.get("sucursalId") || "").trim();

    const matchFilter: MatchFilter = {};

    const userRol = session.user.rol;
    const allowAny = canFilterAnySucursal(userRol);

    if (allowAny && sucursalIdRaw && mongoose.Types.ObjectId.isValid(sucursalIdRaw)) {
      matchFilter.sucursal = new mongoose.Types.ObjectId(sucursalIdRaw);
    } else {
      if (!session.user.sucursal) {
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
      }
      matchFilter.sucursal = new mongoose.Types.ObjectId(session.user.sucursal);
    }

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

    const proveedores = await Proveedor.aggregate([
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
          proveedorId: 1,
          cuit: 1,
          razonSocial: 1,
          nombreFantasia: 1,
          domicilio: 1,
          barrio: 1,
          localidad: 1,
          provincia: 1,
          codigoPostal: 1,
          telefono: 1,
          email: 1,
          categoriaIVA: 1,
          fechaVtoCAI: 1,
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

    return NextResponse.json({ success: true, data: proveedores });
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
  if (!session.user.sucursal) {
    return NextResponse.json(
      { success: false, error: "Usuario sin sucursal asignada" },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    const body = (await request.json()) as ProveedorCreateBody;

    // ✅ ignoramos sucursal/creadoPor del body sin delete ni any
    const { sucursal: _ignoredSucursal, creadoPor: _ignoredCreadoPor, ...rest } = body;

    const proveedor = await Proveedor.create({
      ...rest,
      creadoPor: new mongoose.Types.ObjectId(session.user.id),
      sucursal: new mongoose.Types.ObjectId(session.user.sucursal),
    });

    return NextResponse.json({ success: true, data: proveedor }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
