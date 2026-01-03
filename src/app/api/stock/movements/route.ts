import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import StockMovement from "@/models/StockMovement";
import { zCreateMovement } from "@/lib/validation/stock";
import { applyMovement, applyTransfer } from "@/lib/stock/ledger";
import type { FilterQuery } from "mongoose";

type MovementFilterShape = {
  itemId?: string;
  warehouseId?: string;
};

function errorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Error";
  }
}

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const itemId = searchParams.get("itemId")?.trim() || undefined;
  const warehouseId = searchParams.get("warehouseId")?.trim() || undefined;

  const filter: FilterQuery<MovementFilterShape> = {};
  if (itemId) filter.itemId = itemId;
  if (warehouseId) filter.warehouseId = warehouseId;

  const movements = await StockMovement.find(filter)
    .populate("itemId")
    .populate("warehouseId")
    .populate("locationId")
    .sort({ createdAt: -1 })
    .limit(300);

  return NextResponse.json({ ok: true, data: movements });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();

  const parsed = zCreateMovement.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    if (parsed.data.type === "TRANSFER") {
      const r = parsed.data.ref;
      await applyTransfer({
        itemId: parsed.data.itemId,
        uom: parsed.data.uom,
        qty: parsed.data.qty,
        from: parsed.data.from,
        to: parsed.data.to,
        lot: parsed.data.lot,
        serial: parsed.data.serial,
        note: parsed.data.note,
        ref: r ? { kind: r.kind, id: r.id } : undefined,
      });
      return NextResponse.json({ ok: true });
    }

    const r = parsed.data.ref;
    await applyMovement({
      type: parsed.data.type,
      itemId: parsed.data.itemId,
      warehouseId: parsed.data.warehouseId,
      locationId: parsed.data.locationId,
      qty: parsed.data.qty,
      uom: parsed.data.uom,
      unitCost: parsed.data.unitCost,
      lot: parsed.data.lot,
      serial: parsed.data.serial,
      note: parsed.data.note,
      ref: r ? { kind: r.kind, id: r.id } : undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: errorMessage(e) }, { status: 400 });
  }
}
