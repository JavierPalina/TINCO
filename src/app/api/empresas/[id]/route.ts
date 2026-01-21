import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Empresa from "@/models/Empresa";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();

  try {
    const empresa = await Empresa.findById(id);
    if (!empresa) {
      return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: empresa });
  } catch (error) {
    console.error("Error en GET /api/empresas/[id]:", error);
    return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();

  try {
    const body = await req.json();

    const empresaActualizada = await Empresa.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!empresaActualizada) {
      return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: empresaActualizada });
  } catch (error) {
    console.error("Error en PUT /api/empresas/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error del servidor o datos inválidos" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();

  try {
    const empresaEliminada = await Empresa.findByIdAndDelete(id);
    if (!empresaEliminada) {
      return NextResponse.json({ success: false, error: "Empresa no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { message: "Empresa eliminada correctamente" } });
  } catch (error) {
    console.error("Error en DELETE /api/empresas/[id]:", error);
    return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
  }
}
