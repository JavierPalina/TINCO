import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Item from "@/models/Item";
import { zCreateItem } from "@/lib/validation/stock";
import type { FilterQuery } from "mongoose";

type ItemFilterShape = {
  active?: boolean;
  category?: string;
  type?: string;
  $or?: Array<
    | { sku: { $regex: string; $options: string } }
    | { name: { $regex: string; $options: string } }
  >;
};

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search")?.trim() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const type = searchParams.get("type")?.trim() || undefined;
  const activeParam = searchParams.get("active"); // null si no viene

  const filter: FilterQuery<ItemFilterShape> = {};

  if (activeParam !== null) filter.active = activeParam === "true";
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
