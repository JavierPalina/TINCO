import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import StockBalance from "@/models/StockBalance";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const warehouseId = searchParams.get("warehouseId")?.trim();
  const itemId = searchParams.get("itemId")?.trim();
  const locationId = searchParams.get("locationId")?.trim();

  const filter: any = {};
  if (warehouseId) filter.warehouseId = warehouseId;
  if (itemId) filter.itemId = itemId;
  if (locationId) filter.locationId = locationId;

  const balances = await StockBalance.find(filter)
    .populate("itemId")
    .populate("warehouseId")
    .populate("locationId")
    .sort({ updatedAt: -1 })
    .limit(500);

  const data = balances.map((b: any) => ({
    _id: b._id,
    item: b.itemId,
    warehouse: b.warehouseId,
    location: b.locationId,
    onHand: b.onHand,
    reserved: b.reserved,
    available: b.onHand - b.reserved,
    updatedAt: b.updatedAt,
  }));

  return NextResponse.json({ ok: true, data });
}
