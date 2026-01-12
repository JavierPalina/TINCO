import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import EtapaCotizacion from "@/models/EtapaCotizacion";
import FormularioEtapa from "@/models/FormularioEtapa";
import Cotizacion from "@/models/Cotizacion"; // ajustá el path/nombre según tu proyecto

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ etapaId: string }> }
) {
  await dbConnect();

  try {
    const { etapaId } = await params;

    if (!mongoose.Types.ObjectId.isValid(etapaId)) {
      return NextResponse.json(
        { success: false, error: "ID de etapa inválido." },
        { status: 400 }
      );
    }

    // 1) Validar si hay leads/cotizaciones en la etapa
    const leadsCount = await Cotizacion.countDocuments({ etapa: etapaId });

    if (leadsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `No se puede eliminar la etapa porque tiene ${leadsCount} lead(s). Movelos a otra etapa antes de eliminar.`,
          code: "STAGE_HAS_LEADS",
          leadsCount,
        },
        { status: 409 } // conflicto lógico
      );
    }

    // 2) Eliminar etapa + formulario (idealmente en transacción)
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
