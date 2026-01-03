import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { ObjectId } from "mongodb";
import { ROLES } from "@/lib/roles";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID de usuario inválido." }, { status: 400 });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID de usuario inválido." }, { status: 400 });
    }

    const body = await req.json();

    // ✅ whitelist para evitar que te metan campos peligrosos
    const allowed: Record<string, unknown> = {};

    if (typeof body.name === "string") allowed.name = body.name;
    if (typeof body.email === "string") allowed.email = body.email;
    if (typeof body.activo === "boolean") allowed.activo = body.activo;

    if (typeof body.rol === "string" && (ROLES as readonly string[]).includes(body.rol)) {
      allowed.rol = body.rol;
    }

    if (body.personalData && typeof body.personalData === "object") allowed.personalData = body.personalData;
    if (body.contactData && typeof body.contactData === "object") allowed.contactData = body.contactData;
    if (body.laboralData && typeof body.laboralData === "object") allowed.laboralData = body.laboralData;
    if (body.financieraLegalData && typeof body.financieraLegalData === "object") {
      allowed.financieraLegalData = body.financieraLegalData;
    }

    const user = await User.findByIdAndUpdate(id, allowed, { new: true, runValidators: true }).select("-password");
    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error.";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await params;
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
