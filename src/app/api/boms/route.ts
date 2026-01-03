import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bom from "@/models/Bom";
import { zCreateBom } from "@/lib/validation/stock";
import type { FilterQuery } from "mongoose";

// Si tu modelo Bom no exporta el tipo del documento, tipamos el filtro por forma mínima.
// Esto evita `any` y satisface ESLint.
type BomFilterShape = {
  finishedItemId?: string;
  active?: boolean;
};

export async function GET(req: Request) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const finishedItemId = searchParams.get("finishedItemId")?.trim() || undefined;
  const activeParam = searchParams.get("active"); // null si no viene

  const filter: FilterQuery<BomFilterShape> = {};

  if (finishedItemId) filter.finishedItemId = finishedItemId;
  if (activeParam !== null) filter.active = activeParam === "true";

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
