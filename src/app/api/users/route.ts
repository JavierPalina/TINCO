// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import mongoose from "mongoose";
import type { FilterQuery } from "mongoose";

export const dynamic = "force-dynamic";

type UserListRow = {
  name?: string;
  email?: string;
  rol: string;
  activo: boolean;
  sucursal?: mongoose.Types.ObjectId | null;
};

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Error del servidor";
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);

    const searchTerm = (searchParams.get("searchTerm") || "").trim();
    const sucursalIdRaw = (searchParams.get("sucursalId") || "").trim(); // ObjectId | "none" | ""

    const query: FilterQuery<UserListRow> = {};

    // Search
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
      ];
    }

    // Filtro por sucursal
    if (sucursalIdRaw) {
      if (sucursalIdRaw === "none") {
        query.sucursal = null;
      } else {
        if (!isValidObjectId(sucursalIdRaw)) {
          return NextResponse.json(
            { success: false, error: "ID de sucursal inválido." },
            { status: 400 }
          );
        }
        query.sucursal = new mongoose.Types.ObjectId(sucursalIdRaw);
      }
    }

    const users = await User.find(query)
      .select("_id name email rol activo sucursal")
      .populate("sucursal", "_id nombre")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: users });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
