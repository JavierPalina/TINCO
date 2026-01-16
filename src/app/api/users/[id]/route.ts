// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ObjectId } from "mongodb";
import { ROLES } from "@/lib/roles";
import mongoose from "mongoose";
import { Sucursal } from "@/models/Sucursal";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req: NextRequest, context: RouteContext) {
  await dbConnect();

  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID de usuario inválido." }, { status: 400 });
    }

    const user = await User.findById(id)
      .select("-password")
      .populate("sucursal", "_id nombre")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  await dbConnect();

  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID de usuario inválido." }, { status: 400 });
    }

    const body: unknown = await req.json();
    const b = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;

    // ✅ whitelist
    const allowed: Record<string, unknown> = {};

    if (typeof b.name === "string") allowed.name = b.name;
    if (typeof b.email === "string") allowed.email = b.email;
    if (typeof b.activo === "boolean") allowed.activo = b.activo;

    if (typeof b.rol === "string" && (ROLES as readonly string[]).includes(b.rol)) {
      allowed.rol = b.rol;
    }

    if (b.personalData && typeof b.personalData === "object") allowed.personalData = b.personalData;
    if (b.contactData && typeof b.contactData === "object") allowed.contactData = b.contactData;
    if (b.laboralData && typeof b.laboralData === "object") allowed.laboralData = b.laboralData;
    if (b.financieraLegalData && typeof b.financieraLegalData === "object") {
      allowed.financieraLegalData = b.financieraLegalData;
    }

    // ✅ NUEVO: asignación de sucursal
    // Espera: sucursalId: string | null
    if ("sucursalId" in b) {
      const sucursalId = b.sucursalId;

      if (sucursalId === null) {
        allowed.sucursal = null;
      } else if (typeof sucursalId === "string") {
        const trimmed = sucursalId.trim();
        if (!trimmed) {
          allowed.sucursal = null;
        } else {
          if (!isValidObjectId(trimmed)) {
            return NextResponse.json(
              { success: false, error: "ID de sucursal inválido." },
              { status: 400 }
            );
          }

          const exists = await Sucursal.findById(trimmed).select("_id").lean();
          if (!exists) {
            return NextResponse.json(
              { success: false, error: "Sucursal no encontrada." },
              { status: 404 }
            );
          }

          allowed.sucursal = new mongoose.Types.ObjectId(trimmed);
        }
      } else {
        return NextResponse.json(
          { success: false, error: "sucursalId debe ser string o null." },
          { status: 400 }
        );
      }
    }

    const user = await User.findByIdAndUpdate(id, allowed, { new: true, runValidators: true })
      .select("-password")
      .populate("sucursal", "_id nombre")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  await dbConnect();

  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID de usuario inválido." }, { status: 400 });
    }

    const deletedUser = await User.deleteOne({ _id: id });
    if (deletedUser.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
