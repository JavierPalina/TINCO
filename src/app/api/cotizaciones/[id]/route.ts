// src/app/api/cotizaciones/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Cotizacion from "@/models/Cotizacion";

type RouteContext = { params: Promise<{ id: string }> };

type QuoteArchivo = {
  uid: string;
  url: string;
  publicId?: string;
  name?: string;
  createdAt?: string;
};

type QuoteFactura = {
  uid: string;
  numero?: string;
  fecha?: string;
  monto?: number;
  estado?: "pendiente" | "pagada" | "vencida" | "anulada";
  url?: string;
};

type QuotePago = {
  uid: string;
  fecha?: string;
  monto?: number;
  metodo?: string;
  referencia?: string;
  comprobanteUrl?: string;
};

type QuoteImagen = { uid: string; url: string; caption?: string };

type QuoteMaterial = {
  uid: string;
  descripcion: string;
  cantidad?: number;
  unidad?: string;
  estado?: "pendiente" | "pedido" | "recibido" | "cancelado";
};

type QuoteTicket = {
  uid: string;
  titulo: string;
  estado?: "abierto" | "en_progreso" | "cerrado";
  createdAt?: string;
  descripcion?: string;
  url?: string;
};

type PutOps =
  | { op: "setNombre"; nombre: string }
  | { op: "setCodigo"; codigo: string }
  | { op: "appendArchivos"; archivos: QuoteArchivo[] }
  | { op: "removeArchivo"; uid: string }
  | { op: "addFactura"; factura: QuoteFactura }
  | { op: "removeFactura"; uid: string }
  | { op: "addPago"; pago: QuotePago }
  | { op: "removePago"; uid: string }
  | { op: "addImagen"; imagen: QuoteImagen }
  | { op: "removeImagen"; uid: string }
  | { op: "addMaterial"; material: QuoteMaterial }
  | { op: "removeMaterial"; uid: string }
  | { op: "addTicket"; ticket: QuoteTicket }
  | { op: "removeTicket"; uid: string };

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const cotizacion = await Cotizacion.findById(id)
      .populate("cliente")
      .populate("vendedor", "name email")
      .populate("etapa", "nombre color")
      .populate("historialEtapas.etapa", "nombre color");

    if (!cotizacion) {
      return NextResponse.json({ success: false, error: "Cotización no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: cotizacion });
  } catch {
    return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const body = (await request.json()) as PutOps;
    const update: Record<string, unknown> = {};

    switch (body.op) {
      case "setNombre":
        update.$set = { nombre: body.nombre.trim() };
        break;

      case "setCodigo": {
        const next = body.codigo.trim().toUpperCase();
        if (!next) throw new Error("codigo es obligatorio");

        // validar unicidad manual para devolver error legible
        const exists = await Cotizacion.findOne({ codigo: next, _id: { $ne: id } }).select("_id").lean();
        if (exists) throw new Error("Ya existe una cotización con ese código");

        update.$set = { codigo: next };
        break;
      }

      case "appendArchivos":
        update.$push = { archivos: { $each: body.archivos } };
        break;

      case "removeArchivo":
        update.$pull = { archivos: { uid: body.uid } };
        break;

      case "addFactura":
        update.$push = { facturas: body.factura };
        break;

      case "removeFactura":
        update.$pull = { facturas: { uid: body.uid } };
        break;

      case "addPago":
        update.$push = { pagos: body.pago };
        break;

      case "removePago":
        update.$pull = { pagos: { uid: body.uid } };
        break;

      case "addImagen":
        update.$push = { imagenes: body.imagen };
        break;

      case "removeImagen":
        update.$pull = { imagenes: { uid: body.uid } };
        break;

      case "addMaterial":
        update.$push = { materialPedido: body.material };
        break;

      case "removeMaterial":
        update.$pull = { materialPedido: { uid: body.uid } };
        break;

      case "addTicket":
        update.$push = { tickets: body.ticket };
        break;

      case "removeTicket":
        update.$pull = { tickets: { uid: body.uid } };
        break;

      default:
        return NextResponse.json({ success: false, error: "Operación inválida" }, { status: 400 });
    }

    const updated = await Cotizacion.findByIdAndUpdate(id, update, { new: true })
      .populate("cliente")
      .populate("vendedor", "name email")
      .populate("etapa", "nombre color")
      .populate("historialEtapas.etapa", "nombre color");

    if (!updated) {
      return NextResponse.json({ success: false, error: "Cotización no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const deleted = await Cotizacion.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Cotización no encontrada" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
  }
}
