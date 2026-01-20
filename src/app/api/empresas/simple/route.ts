import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Empresa from "@/models/Empresa";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import mongoose from "mongoose";

function canFilterAnySucursal(rol?: string) {
  return rol === "admin" || rol === "superadmin" || rol === "gerente";
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(request: NextRequest) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  // si el usuario no tiene sucursal y no es admin, no puede ver nada
  const allowSucursalFilter = canFilterAnySucursal(session.user.rol);
  const userSucursal = session.user.sucursal;

  const { searchParams } = new URL(request.url);
  const qRaw = (searchParams.get("q") || "").trim();
  const sucursalIdRaw = (searchParams.get("sucursalId") || "").trim();

  // Determinar sucursal efectiva
  let effectiveSucursal: mongoose.Types.ObjectId | null = null;

  if (allowSucursalFilter && sucursalIdRaw && mongoose.Types.ObjectId.isValid(sucursalIdRaw)) {
    effectiveSucursal = new mongoose.Types.ObjectId(sucursalIdRaw);
  } else if (userSucursal && mongoose.Types.ObjectId.isValid(userSucursal)) {
    effectiveSucursal = new mongoose.Types.ObjectId(userSucursal);
  }

  if (!effectiveSucursal) {
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }

  const filter: Record<string, unknown> = {
    sucursal: effectiveSucursal,
  };

  if (qRaw) {
    const safe = escapeRegex(qRaw);
    const rx = new RegExp(safe, "i");
    filter.$or = [
      { razonSocial: { $regex: rx } },
      { nombreFantasia: { $regex: rx } },
      { cuit: { $regex: rx } },
    ];
  }

  const data = await Empresa.find(filter)
    .select({ razonSocial: 1, nombreFantasia: 1, cuit: 1 })
    .sort({ razonSocial: 1 })
    .limit(50)
    .lean();

  return NextResponse.json({ success: true, data }, { status: 200 });
}
