// src/app/api/cotizaciones/[id]/move/route.ts

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Cotizacion, { ICotizacion } from "@/models/Cotizacion";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function tryParseNumber(v: unknown): number | null {
  if (isFiniteNumber(v)) return v;
  if (typeof v === "string") {
    const normalized = v.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Intenta detectar el valor de precio dentro del historial
 * buscando cualquier key que contenga "precio" (case-insensitive).
 * Esto te evita depender del nombre exacto del campo (precio / precio_total / etc).
 */
function extractPriceFromHistorial(historial: Record<string, unknown>): number | null {
  for (const [k, v] of Object.entries(historial)) {
    if (k.toLowerCase().includes("precio")) {
      const parsed = tryParseNumber(v);
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  const { id } = await params;
  const body = await request.json();

  // Ahora aceptamos montoTotal opcional
  const { etapa, historial, montoTotal } = body || {};

  console.log("[API] ➡️ Incoming body:", JSON.stringify(body));

  if (!ObjectId.isValid(id)) {
    console.warn("[API] ⚠️ Invalid Quote ID:", id);
    return NextResponse.json(
      { success: false, error: "Invalid quote ID." },
      { status: 400 }
    );
  }

  if (!etapa || !ObjectId.isValid(etapa)) {
    console.warn("[API] ⚠️ Invalid or missing target stage ID.");
    return NextResponse.json(
      { success: false, error: "Target stage ID is invalid or missing." },
      { status: 400 }
    );
  }
  const etapaObjectId = new mongoose.Types.ObjectId(etapa);

  try {
    const cotizacion = (await Cotizacion.findById(id)) as ICotizacion;
    if (!cotizacion) {
      console.warn("[API] ⚠️ Quote not found:", id);
      return NextResponse.json(
        { success: false, error: "Quote not found." },
        { status: 404 }
      );
    }

    console.log("[API] 📦 Fetched document:", JSON.stringify(cotizacion.toObject()));

    const plainHistorial =
      historial === undefined ? {} : JSON.parse(JSON.stringify(historial));
    console.log("[API] 🛠️ Normalized history data:", JSON.stringify(plainHistorial));

    // ======= NUEVO: actualizar montoTotal si viene precio =======
    const previousMonto = cotizacion.montoTotal;

    // 1) Prioridad: montoTotal explícito en body
    let nextMonto: number | null = tryParseNumber(montoTotal);

    // 2) Si no vino, intentar inferir desde historial (cualquier key con "precio")
    if (nextMonto === null) {
      nextMonto = extractPriceFromHistorial(plainHistorial);
    }

    // Aplicamos si es válido
    if (nextMonto !== null) {
      cotizacion.montoTotal = nextMonto;
      cotizacion.markModified("montoTotal");
    }

    // Guardamos info de precios en el historial para mostrar en el pipeline
    const datosFormularioWithPriceMeta: Record<string, unknown> = {
      ...plainHistorial,
      __precioAnterior: previousMonto,
      __precioNuevo: nextMonto !== null ? nextMonto : previousMonto,
    };

    const newHistItem = {
      etapa: etapaObjectId,
      fecha: new Date(),
      datosFormulario: datosFormularioWithPriceMeta,
    };

    console.log("[API] 📝 New history item:", JSON.stringify(newHistItem));

    cotizacion.etapa = etapaObjectId;
    cotizacion.historialEtapas.push(newHistItem);
    cotizacion.markModified("historialEtapas");

    console.log("[API] 🔄 Updated array before save:", JSON.stringify(cotizacion.historialEtapas));

    await cotizacion.save();
    console.log("[API] ✅ Document saved successfully.");

    const refreshed = (await Cotizacion.findById(id).lean()) as ICotizacion | null;
    console.log("[API] ✨ Final document from DB:", JSON.stringify(refreshed?.historialEtapas));

    return NextResponse.json({ success: true, data: refreshed });
  } catch (error) {
    console.error("[API] ❌ API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
