import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Cotizacion from "@/models/Cotizacion";
import Proyecto from "@/models/Proyecto";
import Tarea from "@/models/Tarea";
import "@/models/Cliente";

export type ActividadItem = {
  id: string;
  type: "cotizacion" | "proyecto" | "tarea";
  titulo: string;
  subtitulo: string;
  badge: string;
  fecha: string;
  href: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const [cotizaciones, proyectos, tareas] = await Promise.all([
    Cotizacion.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("titulo cliente etapaActual updatedAt")
      .populate("cliente", "nombreCompleto")
      .lean(),
    Proyecto.find({})
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("numeroOrden cliente estadoActual updatedAt")
      .populate("cliente", "nombreCompleto")
      .lean(),
    Tarea.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("titulo cliente prioridad completada createdAt")
      .populate("cliente", "nombreCompleto")
      .lean(),
  ]);

  const items: ActividadItem[] = [
    ...cotizaciones.map((c) => ({
      id: String(c._id),
      type: "cotizacion" as const,
      titulo: (c.titulo as string) || "Cotización",
      subtitulo:
        (c.cliente as { nombreCompleto?: string } | null)?.nombreCompleto || "",
      badge: (c.etapaActual as string) || "En proceso",
      fecha: String(c.updatedAt),
      href: `/dashboard/negocios`,
    })),
    ...proyectos.map((p) => ({
      id: String(p._id),
      type: "proyecto" as const,
      titulo: `Proyecto ${p.numeroOrden as string}`,
      subtitulo:
        (p.cliente as { nombreCompleto?: string } | null)?.nombreCompleto || "",
      badge: (p.estadoActual as string) || "Sin estado",
      fecha: String(p.updatedAt),
      href: `/dashboard/proyectos/${String(p._id)}`,
    })),
    ...tareas.map((t) => ({
      id: String(t._id),
      type: "tarea" as const,
      titulo: t.titulo as string,
      subtitulo:
        (t.cliente as { nombreCompleto?: string } | null)?.nombreCompleto || "",
      badge: (t.completada as boolean) ? "Completada" : (t.prioridad as string),
      fecha: String(t.createdAt),
      href: `/dashboard`,
    })),
  ];

  items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return NextResponse.json({ data: items.slice(0, 10) });
}
