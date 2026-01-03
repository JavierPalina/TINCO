import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bom from "@/models/Bom";
import { zCreateBom } from "@/lib/validation/stock";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const finishedItemId = searchParams.get("finishedItemId")?.trim();
  const active = searchParams.get("active");

  const filter: any = {};
  if (finishedItemId) filter.finishedItemId = finishedItemId;
  if (active !== null) filter.active = active === "true";

  const boms = await Bom.find(filter)
    .populate("finishedItemId")
    .populate("lines.componentItemId")
    .sort({ updatedAt: -1 })
    .limit(200);

  return NextResponse.json({ ok: true, data: boms });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const parsed = zCreateBom.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await Bom.create(parsed.data);
  return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
