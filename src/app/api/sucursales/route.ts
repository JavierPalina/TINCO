// /app/api/sucursales/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Sucursal } from "@/models/Sucursal";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const searchTerm = (searchParams.get("searchTerm") || "").trim();

    const query: any = {};
    if (searchTerm) {
      query.$or = [
        { nombre: { $regex: searchTerm, $options: "i" } },
        { direccion: { $regex: searchTerm, $options: "i" } },
        { linkPagoAbierto: { $regex: searchTerm, $options: "i" } },
        { cbu: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const data = await Sucursal.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Error en GET /api/sucursales" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = await req.json();

    if (!body?.direccion || !String(body.direccion).trim()) {
      return NextResponse.json(
        { ok: false, message: "La dirección es obligatoria." },
        { status: 400 }
      );
    }

    const created = await Sucursal.create({
        nombre: String(body.nombre || "").trim(),
      direccion: String(body.direccion).trim(),
      linkPagoAbierto: String(body.linkPagoAbierto || "").trim(),
      cbu: String(body.cbu || "").trim(),
      email: String(body.email || "").trim(),
      qrPagoAbiertoImg: String(body.qrPagoAbiertoImg || ""),
      aliasImg: String(body.aliasImg || ""),
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Error en POST /api/sucursales" },
      { status: 500 }
    );
  }
}
