import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import { zUpdateItem } from "@/lib/validation/stock";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  await dbConnect();
  const item = await Item.findById(ctx.params.id);
  if (!item) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: item });
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  await dbConnect();
  const body = await req.json();
  const parsed = zUpdateItem.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await Item.findByIdAndUpdate(ctx.params.id, parsed.data, { new: true });
  if (!updated) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, data: updated });
}
