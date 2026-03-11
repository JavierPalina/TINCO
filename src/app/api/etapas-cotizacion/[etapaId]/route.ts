import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import EtapaCotizacion from "@/models/EtapaCotizacion";
import FormularioEtapa from "@/models/FormularioEtapa";
import Cotizacion from "@/models/Cotizacion";

type RouteContext = {
  params: Promise<{ etapaId: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  try {
    const { etapaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: "ID de etapa inválido." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const nombre =
      typeof body?.nombre === "string" ? body.nombre.trim() : undefined;
    const color =
      typeof body?.color === "string" ? body.color.trim() : undefined;

    if (!nombre && !color) {
      return NextResponse.json(
        {
          success: false,
          error: "Debés enviar al menos un campo para actualizar: nombre o color.",
        },
        { status: 400 }
      );
    }

    const etapaActual = await EtapaCotizacion.findById(etapaId);
    if (!etapaActual) {
      return NextResponse.json(
        { success: false, error: "Etapa no encontrada." },
        { status: 404 }
      );
    }

    if (nombre) {
      const existeOtraConMismoNombre = await EtapaCotizacion.findOne({
        _id: { $ne: etapaId },
        nombre: { $regex: `^${nombre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });

      if (existeOtraConMismoNombre) {
        return NextResponse.json(
          { success: false, error: "Ya existe otra etapa con ese nombre." },
          { status: 409 }
        );
      }

      etapaActual.nombre = nombre;
    }

    if (color) {
      etapaActual.color = color;
    }

    await etapaActual.save();

    return NextResponse.json({
      success: true,
      data: etapaActual,
    });
  } catch (error: unknown) {
    console.error("Error en PATCH /api/etapas-cotizacion/[etapaId]:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  try {
    const { etapaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: "ID de etapa inválido." },
        { status: 400 }
      );
    }

    const leadsCount = await Cotizacion.countDocuments({ etapa: etapaId });

    if (leadsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar la etapa porque tiene ${leadsCount} lead(s). Movelos a otra etapa antes de eliminar.`,
          code: "STAGE_HAS_LEADS",
          leadsCount,
        },
        { status: 409 }
      );
    }

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await FormularioEtapa.deleteOne({ etapaId }, { session });
        await EtapaCotizacion.deleteOne({ _id: etapaId }, { session });
      });
    } finally {
      session.endSession();
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error en DELETE /api/etapas-cotizacion/[etapaId]:", error);
    return NextResponse.json(
      { success: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}