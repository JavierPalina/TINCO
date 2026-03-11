import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import FormularioEtapa from "@/models/FormularioEtapa";
import EtapaCotizacion from "@/models/EtapaCotizacion";
import mongoose from "mongoose";

type RouteContext = {
  params: Promise<{ etapaId: string }>;
};

export async function GET(req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  try {
    const { etapaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: "ID de etapa de formulario inválido." },
        { status: 400 }
      );
    }

    const formulario = await FormularioEtapa.findOne({ etapaId });
    if (!formulario) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: formulario });
  } catch (error: unknown) {
    console.error("Error en GET /api/formularios-etapa/[etapaId]:", error);
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

export async function PUT(req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  try {
    const { etapaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: "ID de etapa inválido." },
        { status: 400 }
      );
    }

    const etapaExiste = await EtapaCotizacion.findById(etapaId).select("_id");
    if (!etapaExiste) {
      return NextResponse.json(
        { success: false, error: "La etapa no existe." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const campos = body?.campos;

    if (!Array.isArray(campos)) {
      return NextResponse.json(
        { success: false, error: "El campo 'campos' debe ser un array." },
        { status: 400 }
      );
    }

    const camposNormalizados = campos.map((campo: unknown, index: number) => {
      const c = (campo ?? {}) as Record<string, unknown>;

      return {
        ...c,
        orden:
          typeof c.orden === "number" && Number.isFinite(c.orden)
            ? c.orden
            : index,
      };
    });

    const formularioActualizado = await FormularioEtapa.findOneAndUpdate(
      { etapaId },
      {
        $set: {
          etapaId,
          campos: camposNormalizados,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      data: formularioActualizado,
    });
  } catch (error: unknown) {
    console.error("Error en PUT /api/formularios-etapa/[etapaId]:", error);
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