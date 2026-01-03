import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Proyecto from "@/models/Proyecto";
import Cotizacion from "@/models/Cotizacion";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";
import type { FilterQuery } from "mongoose";

// Tipos auxiliares
interface CrearProyectoBody {
  clienteId?: string;
  cotizacionId?: string;
}

interface SessionUserWithId {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

/**
 * Tipado mínimo del documento Proyecto para filtros.
 * No necesitamos todo el schema, solo los campos usados en el query.
 */
type ProyectoFilter = FilterQuery<{
  estadoActual?: string | null;
}>;

// --- GET: OBTENER TODOS LOS PROYECTOS (para la tabla del dashboard) ---
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);

    const estado = searchParams.get("estado");
    const estadosParam = searchParams.get("estados"); // CSV con varios estados
    const sinEstado = searchParams.get("sinEstado"); // "1" para incluir null/empty

    const filtro: ProyectoFilter = {};

    // Parse estados
    let estadosArray: string[] = [];
    if (estadosParam) {
      estadosArray = estadosParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Armamos condiciones combinables sin "any"
    const conditions: ProyectoFilter[] = [];

    if (estadosArray.length) {
      conditions.push({ estadoActual: { $in: estadosArray } });
    } else if (estado) {
      conditions.push({ estadoActual: estado });
    }

    if (sinEstado === "1") {
      conditions.push({
        $or: [
          { estadoActual: { $exists: false } },
          { estadoActual: null },
          { estadoActual: "" },
        ],
      });
    }

    if (conditions.length === 1) {
      Object.assign(filtro, conditions[0]);
    } else if (conditions.length > 1) {
      // Mantengo tu comportamiento: combinar en $or
      filtro.$or = conditions;
    }

    const proyectos = await Proyecto.find(filtro)
      .populate("cliente", "nombreCompleto telefono direccion")
      .populate("vendedor", "name")
      .populate("visitaTecnica.asignadoA", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: proyectos });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// --- POST: CREAR UN NUEVO PROYECTO (trigger manual o desde ventas) ---
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const body = (await request.json()) as CrearProyectoBody;
    const { clienteId, cotizacionId } = body;

    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: "El ID del cliente es requerido" },
        { status: 400 },
      );
    }

    const user = session.user as SessionUserWithId;
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Usuario de sesión sin ID" },
        { status: 400 },
      );
    }

    let vendedorId: string = user.id;

    if (cotizacionId) {
      const cotizacion = await Cotizacion.findById(cotizacionId);
      if (cotizacion && cotizacion.vendedor) {
        vendedorId = cotizacion.vendedor.toString();
      }
    }

    // Se crea SIN estadoActual (lo dejás explícito como null)
    const nuevoProyecto = await Proyecto.create({
      cliente: clienteId,
      cotizacion: cotizacionId,
      vendedor: vendedorId,
      estadoActual: null,
    });

    return NextResponse.json({ success: true, data: nuevoProyecto }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
