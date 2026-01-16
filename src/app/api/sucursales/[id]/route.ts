// /app/api/sucursales/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Sucursal } from "@/models/Sucursal";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const id = params.id;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    const doc = await Sucursal.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ ok: false, message: "Sucursal no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: doc }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Error en GET /api/sucursales/[id]" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const id = params.id;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();

    if (body?.direccion !== undefined && !String(body.direccion).trim()) {
      return NextResponse.json(
        { ok: false, message: "La dirección no puede quedar vacía." },
        { status: 400 }
      );
    }

    const updated = await Sucursal.findByIdAndUpdate(
      id,
      {
        ...(body.nombre !== undefined ? { nombre: String(body.nombre).trim() } : {}),
        ...(body.direccion !== undefined ? { direccion: String(body.direccion).trim() } : {}),
        ...(body.linkPagoAbierto !== undefined ? { linkPagoAbierto: String(body.linkPagoAbierto).trim() } : {}),
        ...(body.cbu !== undefined ? { cbu: String(body.cbu).trim() } : {}),
        ...(body.email !== undefined ? { email: String(body.email).trim() } : {}),
        ...(body.qrPagoAbiertoImg !== undefined ? { qrPagoAbiertoImg: String(body.qrPagoAbiertoImg) } : {}),
        ...(body.aliasImg !== undefined ? { aliasImg: String(body.aliasImg) } : {}),
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ ok: false, message: "Sucursal no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Error en PATCH /api/sucursales/[id]" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await dbConnect();

    const id = params.id;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    const deleted = await Sucursal.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ ok: false, message: "Sucursal no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message || "Error en DELETE /api/sucursales/[id]" },
      { status: 500 }
    );
  }
}
