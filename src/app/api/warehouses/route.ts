import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Warehouse from "@/models/Warehouse";
import { zCreateWarehouse } from "@/lib/validation/stock";

export async function GET() {
  await dbConnect();
  const warehouses = await Warehouse.find({ active: true }).sort({ name: 1 });
  return NextResponse.json({ ok: true, data: warehouses });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const parsed = zCreateWarehouse.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await Warehouse.create(parsed.data);
  return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
