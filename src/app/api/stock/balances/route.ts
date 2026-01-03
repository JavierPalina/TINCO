import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import StockBalance from "@/models/StockBalance";
import type { FilterQuery } from "mongoose";

type BalanceFilterShape = {
  warehouseId?: string;
  itemId?: string;
  locationId?: string;
};

// Tipos mínimos de lo que devolvés (por populate)
type PopulatedEntity = { _id: string; name?: string; sku?: string; code?: string };

type StockBalanceLean = {
  _id: string;
  itemId: PopulatedEntity;
  warehouseId: PopulatedEntity;
  locationId?: PopulatedEntity | null;
  onHand: number;
  reserved: number;
  updatedAt: string | Date;
};

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const warehouseId = searchParams.get("warehouseId")?.trim() || undefined;
  const itemId = searchParams.get("itemId")?.trim() || undefined;
  const locationId = searchParams.get("locationId")?.trim() || undefined;

  const filter: FilterQuery<BalanceFilterShape> = {};
  if (warehouseId) filter.warehouseId = warehouseId;
  if (itemId) filter.itemId = itemId;
  if (locationId) filter.locationId = locationId;

  const balances = (await StockBalance.find(filter)
    .populate("itemId")
    .populate("warehouseId")
    .populate("locationId")
    .sort({ updatedAt: -1 })
    .limit(500)) as unknown as StockBalanceLean[];

  const data = balances.map((b) => ({
    _id: b._id,
    item: b.itemId,
    warehouse: b.warehouseId,
    location: b.locationId ?? null,
    onHand: b.onHand,
    reserved: b.reserved,
    available: b.onHand - b.reserved,
    updatedAt: b.updatedAt,
  }));

  return NextResponse.json({ ok: true, data });
}
