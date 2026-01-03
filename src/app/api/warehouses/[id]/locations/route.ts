import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Location from "@/models/Location";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  const { id } = await params;

  const locations = await Location.find({ warehouseId: id, active: true }).sort({ code: 1 });
  return NextResponse.json({ ok: true, data: locations });
}
