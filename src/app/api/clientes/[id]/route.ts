import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Cliente from "@/models/Cliente";
import Empresa from "@/models/Empresa";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await dbConnect();

  try {
    const cliente = await Cliente.findById(id)
      .populate("vendedorAsignado", "name email")
      .populate("empresaAsignada", "razonSocial nombreFantasia cuit");

    if (!cliente) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: cliente });
  } catch (error) {
    console.error("Error en GET /api/clientes/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error del servidor" },
      { status: 500 }
    );
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

    // Permitimos actualizar empresaAsignada:
    // - null / "" => quitar empresa
    // - string ObjectId válido => asignar empresa existente
    if ("empresaAsignada" in body) {
      const val = body.empresaAsignada;

      if (val === "" || val === null || typeof val === "undefined") {
        body.empresaAsignada = null;
      } else {
        if (!mongoose.Types.ObjectId.isValid(String(val))) {
          return NextResponse.json(
            { success: false, error: "empresaAsignada inválida" },
            { status: 400 }
          );
        }

        const empresaExists = await Empresa.exists({
          _id: new mongoose.Types.ObjectId(String(val)),
        });

        if (!empresaExists) {
          return NextResponse.json(
            { success: false, error: "La empresa indicada no existe" },
            { status: 400 }
          );
        }

        body.empresaAsignada = new mongoose.Types.ObjectId(String(val));
      }
    }

    // (Opcional) Si querés evitar que vuelvan a guardar texto libre, podés bloquearlo:
    // delete body.empresa;
    // delete body.razonSocial;
    // delete body.cuil;
    // delete body.contactoEmpresa;
    // delete body.direccionEmpresa;
    // delete body.ciudadEmpresa;
    // delete body.paisEmpresa;

    const clienteActualizado = await Cliente.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    })
      .populate("vendedorAsignado", "name email")
      .populate("empresaAsignada", "razonSocial nombreFantasia cuit");

    if (!clienteActualizado) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: clienteActualizado });
  } catch (error) {
    console.error("Error en PUT /api/clientes/[id]:", error);
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
    const clienteEliminado = await Cliente.findByIdAndDelete(id);
    if (!clienteEliminado) {
      return NextResponse.json(
        { success: false, error: "Cliente no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: { message: "Cliente eliminado correctamente" },
    });
  } catch (error) {
    console.error("Error en DELETE /api/clientes/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error del servidor" },
      { status: 500 }
    );
  }
}