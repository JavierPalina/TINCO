import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import StockReservation from "@/models/StockReservation";
import { zCreateReservation } from "@/lib/validation/stock";
import { applyReservation } from "@/lib/stock/ledger";

export async function GET(req: Request) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const kind = searchParams.get("kind");
  const refId = searchParams.get("refId");
  const status = searchParams.get("status");

  const filter: any = {};
  if (kind) filter["ref.kind"] = kind;
  if (refId) filter["ref.id"] = refId;
  if (status) filter.status = status;

  const reservations = await StockReservation.find(filter)
    .populate("warehouseId")
    .populate("lines.itemId")
    .sort({ createdAt: -1 })
    .limit(200);

  return NextResponse.json({ ok: true, data: reservations });
}

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();
  const parsed = zCreateReservation.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // crea reserva (documento)
    const created = await StockReservation.create({
      ref: parsed.data.ref,
      warehouseId: parsed.data.warehouseId,
      lines: parsed.data.lines,
      status: "ACTIVE",
      note: parsed.data.note,
      createdAt: new Date(),
    });

    // aplica RESERVE al balance (por línea)
    await applyReservation({
      action: "RESERVE",
      warehouseId: parsed.data.warehouseId,
      lines: parsed.data.lines.map((l) => ({
        itemId: l.itemId,
        qty: l.qty,
        uom: l.uom,
      })),
      ref: parsed.data.ref,
      note: parsed.data.note,
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 });
  }
}
