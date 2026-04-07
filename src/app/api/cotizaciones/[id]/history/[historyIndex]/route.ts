// src/app/api/cotizaciones/[id]/history/[historyIndex]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Cotizacion from "@/models/Cotizacion";

type RouteContext = {
  params: Promise<{ id: string; historyIndex: string }>;
};

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

function extractPriceFromHistorial(historial: Record<string, unknown>): number | null {
  for (const [k, v] of Object.entries(historial)) {
    if (k.toLowerCase().includes("precio")) {
      const parsed = tryParseNumber(v);
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  await dbConnect();

  try {
    const { id, historyIndex } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID de cotización inválido." },
        { status: 400 }
      );
    }

    const index = Number(historyIndex);
    if (!Number.isInteger(index) || index < 0) {
      return NextResponse.json(
        { success: false, error: "Índice de historial inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const datosFormulario =
      body?.datosFormulario && typeof body.datosFormulario === "object"
        ? (body.datosFormulario as Record<string, unknown>)
        : null;

    if (!datosFormulario) {
      return NextResponse.json(
        { success: false, error: "datosFormulario es obligatorio." },
        { status: 400 }
      );
    }

    const cotizacion = await Cotizacion.findById(id);
    if (!cotizacion) {
      return NextResponse.json(
        { success: false, error: "Cotización no encontrada." },
        { status: 404 }
      );
    }

    if (!Array.isArray(cotizacion.historialEtapas) || !cotizacion.historialEtapas[index]) {
      return NextResponse.json(
        { success: false, error: "Entrada de historial no encontrada." },
        { status: 404 }
      );
    }

    const currentHistoryItem = cotizacion.historialEtapas[index];
    const previousData =
      currentHistoryItem?.datosFormulario &&
      typeof currentHistoryItem.datosFormulario === "object"
        ? { ...currentHistoryItem.datosFormulario }
        : {};

    const previousMonto = cotizacion.montoTotal;
    const nextMonto = extractPriceFromHistorial(datosFormulario);

    currentHistoryItem.datosFormulario = {
      ...previousData,
      ...datosFormulario,
      __precioAnterior:
        typeof previousData.__precioAnterior === "number"
          ? previousData.__precioAnterior
          : previousMonto,
      __precioNuevo:
        nextMonto !== null
          ? nextMonto
          : typeof previousData.__precioNuevo === "number"
          ? previousData.__precioNuevo
          : previousMonto,
    };

    const isLastHistoryItem = index === cotizacion.historialEtapas.length - 1;
    if (isLastHistoryItem && nextMonto !== null) {
      cotizacion.montoTotal = nextMonto;
      cotizacion.markModified("montoTotal");
    }

    cotizacion.markModified(`historialEtapas.${index}.datosFormulario`);
    cotizacion.markModified("historialEtapas");

    await cotizacion.save();

    const refreshed = await Cotizacion.findById(id)
      .populate("cliente")
      .populate("vendedor", "name email")
      .populate("etapa", "nombre color")
      .populate("historialEtapas.etapa", "nombre color");

    return NextResponse.json({ success: true, data: refreshed });
  } catch (error) {
    console.error("Error en PATCH /api/cotizaciones/[id]/history/[historyIndex]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}