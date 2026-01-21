import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Prioridad from "@/models/Prioridad";

export async function GET() {
  await dbConnect();
  const prioridades = await Prioridad.find({ activa: true })
    .sort({ nombre: 1 })
    .lean();

  return NextResponse.json({ data: prioridades });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const nombre = (body?.nombre ?? "").trim();

  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 }
    );
  }

  // upsert-like: si ya existe, devolverla
  const existente = await Prioridad.findOne({ nombre }).lean();
  if (existente) {
    return NextResponse.json({ data: existente });
  }

  const creada = await Prioridad.create({ nombre });
  return NextResponse.json({ data: creada }, { status: 201 });
}
