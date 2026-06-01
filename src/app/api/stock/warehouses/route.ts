import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import Warehouse from "@/models/Warehouse";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const warehouses = await Warehouse.find({ active: true })
    .select("name type address")
    .sort({ name: 1 })
    .lean();

  return NextResponse.json({ ok: true, data: warehouses });
}
