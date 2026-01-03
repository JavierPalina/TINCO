import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import StockReservation from "@/models/StockReservation";
import { applyReservation } from "@/lib/stock/ledger";

export async function POST(_req: Request, ctx: { params: { id: string } }) {
  await dbConnect();

  const reservation = await StockReservation.findById(ctx.params.id);
  if (!reservation) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (reservation.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Reservation is not ACTIVE" }, { status: 400 });
  }

  try {
    await applyReservation({
      action: "UNRESERVE",
      warehouseId: reservation.warehouseId.toString(),
      lines: reservation.lines.map((l: any) => ({
        itemId: l.itemId.toString(),
        qty: l.qty,
        uom: l.uom,
      })),
      ref: reservation.ref,
      note: "Release reservation",
    });

    reservation.status = "RELEASED";
    await reservation.save();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 });
  }
}
