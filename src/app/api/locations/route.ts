import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Location from "@/models/Location";
import { zCreateLocation } from "@/lib/validation/stock";

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const parsed = zCreateLocation.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await Location.create(parsed.data);
  return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
