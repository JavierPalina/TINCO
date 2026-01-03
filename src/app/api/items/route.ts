import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import { zCreateItem } from "@/lib/validation/stock";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();
  const type = searchParams.get("type")?.trim();
  const active = searchParams.get("active");

  const filter: any = {};
  if (active !== null) filter.active = active === "true";
  if (category) filter.category = category;
  if (type) filter.type = type;

  if (search) {
    filter.$or = [
      { sku: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];
  }

  const items = await Item.find(filter).sort({ updatedAt: -1 }).limit(200);
  return NextResponse.json({ ok: true, data: items });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const parsed = zCreateItem.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const created = await Item.create(parsed.data);
  return NextResponse.json({ ok: true, data: created }, { status: 201 });
}
