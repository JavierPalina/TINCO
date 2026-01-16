// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const users = await User.find({})
      .select("_id name email rol activo sucursal")
      .populate("sucursal", "_id nombre")
      .lean();

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Error del servidor";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}