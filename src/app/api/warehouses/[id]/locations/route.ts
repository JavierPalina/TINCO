import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Location from "@/models/Location";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  await dbConnect();
  const locations = await Location.find({ warehouseId: ctx.params.id, active: true }).sort({ code: 1 });
  return NextResponse.json({ ok: true, data: locations });
}
