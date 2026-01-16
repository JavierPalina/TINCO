// /app/api/sucursales/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Sucursal } from "@/models/Sucursal";
import type { FilterQuery } from "mongoose";

export const dynamic = "force-dynamic";

type SucursalDocShape = {
  nombre?: string;
  direccion: string;
  linkPagoAbierto?: string;
  cbu?: string;
  email?: string;
  qrPagoAbiertoImg?: string;
  aliasImg?: string;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const searchTerm = (searchParams.get("searchTerm") || "").trim();

    const query: FilterQuery<SucursalDocShape> = {};

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
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, message: getErrorMessage(error) || "Error en GET /api/sucursales" },
      { status: 500 }
    );
  }
}

type CreateSucursalBody = {
  nombre?: unknown;
  direccion?: unknown;
  linkPagoAbierto?: unknown;
  cbu?: unknown;
  email?: unknown;
  qrPagoAbiertoImg?: unknown;
  aliasImg?: unknown;
};

export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json()) as CreateSucursalBody;

    const nombre = String(body.nombre || "").trim();
    const direccion = String(body.direccion || "").trim();

    if (!nombre) {
      return NextResponse.json(
        { ok: false, message: "El nombre es obligatorio." },
        { status: 400 }
      );
    }
    if (!direccion) {
      return NextResponse.json(
        { ok: false, message: "La dirección es obligatoria." },
        { status: 400 }
      );
    }

    const created = await Sucursal.create({
      nombre,
      direccion,
      linkPagoAbierto: String(body.linkPagoAbierto || "").trim(),
      cbu: String(body.cbu || "").trim(),
      email: String(body.email || "").trim(),
      qrPagoAbiertoImg: String(body.qrPagoAbiertoImg || ""),
      aliasImg: String(body.aliasImg || ""),
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, message: getErrorMessage(error) || "Error en POST /api/sucursales" },
      { status: 500 }
    );
  }
}
