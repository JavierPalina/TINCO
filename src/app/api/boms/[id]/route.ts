import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bom from "@/models/Bom";
import { zUpdateBom } from "@/lib/validation/stock";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  await dbConnect();
  const bom = await Bom.findById(ctx.params.id).populate("finishedItemId").populate("lines.componentItemId");
  if (!bom) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: bom });
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  await dbConnect();
  const body = await req.json();
  const parsed = zUpdateBom.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await Bom.findByIdAndUpdate(ctx.params.id, parsed.data, { new: true })
    .populate("finishedItemId")
    .populate("lines.componentItemId");

  if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: updated });
}
