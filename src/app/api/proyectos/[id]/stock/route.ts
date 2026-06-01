import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import StockReservation from "@/models/StockReservation";
import StockBalance from "@/models/StockBalance";
import Item from "@/models/Item";
import Warehouse from "@/models/Warehouse";

// GET — reservations linked to this project
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const reservations = await StockReservation.find({
    "ref.kind": "PROJECT",
    "ref.id": params.id,
  })
    .populate("warehouseId", "name type")
    .lean();

  // Populate item details per line
  const itemIds = [
    ...new Set(
      reservations.flatMap((r) =>
        (r.lines as { itemId: unknown }[]).map((l) => l.itemId),
      ),
    ),
  ];
  const items = await Item.find({ _id: { $in: itemIds } })
    .select("sku name uom")
    .lean();
  const itemMap = new Map(items.map((i) => [String(i._id), i]));

  const result = reservations.map((r) => ({
    ...r,
    lines: (r.lines as { itemId: unknown; qty: number; uom: string }[]).map((l) => ({
      ...l,
      item: itemMap.get(String(l.itemId)) ?? null,
    })),
  }));

  return NextResponse.json({ ok: true, data: result });
}

// POST — create or replace reservation for this project
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const body = await req.json();
  const { warehouseId, lines, note } = body as {
    warehouseId: string;
    lines: { itemId: string; qty: number; uom: string }[];
    note?: string;
  };

  if (!warehouseId || !Array.isArray(lines) || !lines.length) {
    return NextResponse.json(
      { ok: false, error: "warehouseId y lines son requeridos" },
      { status: 400 },
    );
  }

  // Update balances: +reserved per line
  for (const line of lines) {
    await StockBalance.findOneAndUpdate(
      {
        itemId: line.itemId,
        warehouseId,
        locationId: { $exists: false },
      },
      {
        $inc: { reserved: line.qty },
        $setOnInsert: { onHand: 0 },
      },
      { upsert: true, new: true },
    );
  }

  const reservation = await StockReservation.create({
    ref: { kind: "PROJECT", id: params.id },
    warehouseId,
    lines,
    status: "ACTIVE",
    note: note ?? null,
    createdBy: (session.user as { id?: string })?.id,
  });

  return NextResponse.json({ ok: true, data: reservation }, { status: 201 });
}

// DELETE — release a specific reservation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const { reservationId } = await req.json();
  const res = await StockReservation.findOne({
    _id: reservationId,
    "ref.kind": "PROJECT",
    "ref.id": params.id,
    status: "ACTIVE",
  });

  if (!res) {
    return NextResponse.json({ ok: false, error: "Reserva no encontrada" }, { status: 404 });
  }

  // Release reserved qty
  for (const line of res.lines as { itemId: unknown; qty: number }[]) {
    await StockBalance.findOneAndUpdate(
      { itemId: line.itemId, warehouseId: res.warehouseId },
      { $inc: { reserved: -line.qty } },
    );
  }

  res.status = "RELEASED";
  await res.save();

  return NextResponse.json({ ok: true });
}
