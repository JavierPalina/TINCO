import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import { zUpdateItem } from "@/lib/validation/stock";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  const { id } = await params;

  const item = await Item.findById(id);
  if (!item) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: item });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  const { id } = await params;

  const body: unknown = await req.json();
  const parsed = zUpdateItem.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await Item.findByIdAndUpdate(id, parsed.data, { new: true });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: updated });
}
