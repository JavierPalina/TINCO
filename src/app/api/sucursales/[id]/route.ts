// src/app/api/sucursales/[id]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Sucursal } from "@/models/Sucursal";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchSucursalBody = {
  nombre?: unknown;
  direccion?: unknown;
  linkPagoAbierto?: unknown;
  cbu?: unknown;
  email?: unknown;
  qrPagoAbiertoImg?: unknown;
  aliasImg?: unknown;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Error inesperado";
}

export async function GET(_: Request, context: RouteContext) {
  try {
    await dbConnect();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    const doc = await Sucursal.findById(id).lean();
    if (!doc) {
      return NextResponse.json({ ok: false, message: "Sucursal no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: doc }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, message: getErrorMessage(error) || "Error en GET /api/sucursales/[id]" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    await dbConnect();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    const body = (await req.json()) as PatchSucursalBody;

    if (body.nombre !== undefined && !String(body.nombre).trim()) {
      return NextResponse.json(
        { ok: false, message: "El nombre no puede quedar vacío." },
        { status: 400 }
      );
    }

    if (body.direccion !== undefined && !String(body.direccion).trim()) {
      return NextResponse.json(
        { ok: false, message: "La dirección no puede quedar vacía." },
        { status: 400 }
      );
    }

    const update: Record<string, string> = {};

    if (body.nombre !== undefined) update.nombre = String(body.nombre).trim();
    if (body.direccion !== undefined) update.direccion = String(body.direccion).trim();
    if (body.linkPagoAbierto !== undefined) update.linkPagoAbierto = String(body.linkPagoAbierto).trim();
    if (body.cbu !== undefined) update.cbu = String(body.cbu).trim();
    if (body.email !== undefined) update.email = String(body.email).trim();
    if (body.qrPagoAbiertoImg !== undefined) update.qrPagoAbiertoImg = String(body.qrPagoAbiertoImg);
    if (body.aliasImg !== undefined) update.aliasImg = String(body.aliasImg);

    const updated = await Sucursal.findByIdAndUpdate(id, update, { new: true }).lean();

    if (!updated) {
      return NextResponse.json({ ok: false, message: "Sucursal no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, message: getErrorMessage(error) || "Error en PATCH /api/sucursales/[id]" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    await dbConnect();

    const { id } = await context.params;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ ok: false, message: "ID inválido" }, { status: 400 });
    }

    const deleted = await Sucursal.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ ok: false, message: "Sucursal no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, message: getErrorMessage(error) || "Error en DELETE /api/sucursales/[id]" },
      { status: 500 }
    );
  }
}
