import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Proveedor from "@/models/Proveedor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();

  try {
    const proveedor = await Proveedor.findById(id);
    if (!proveedor) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: proveedor });
  } catch (error) {
    console.error("Error en GET /api/proveedores/[id]:", error);
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

    const proveedorActualizado = await Proveedor.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!proveedorActualizado) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: proveedorActualizado });
  } catch (error) {
    console.error("Error en PUT /api/proveedores/[id]:", error);
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
    const proveedorEliminado = await Proveedor.findByIdAndDelete(id);
    if (!proveedorEliminado) {
      return NextResponse.json({ success: false, error: "Proveedor no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { message: "Proveedor eliminado correctamente" } });
  } catch (error) {
    console.error("Error en DELETE /api/proveedores/[id]:", error);
    return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
  }
}
