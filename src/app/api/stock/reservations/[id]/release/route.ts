import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import StockReservation from "@/models/StockReservation";
import { applyReservation } from "@/lib/stock/ledger";

type Uom = "UN" | "M" | "M2" | "KG";
const UOMS = ["UN", "M", "M2", "KG"] as const;

function toUom(v: string): Uom {
  if ((UOMS as readonly string[]).includes(v)) return v as Uom;
  throw new Error(`UOM inválida: ${v}`);
}

type ReservationLineShape = {
  itemId: { toString(): string } | string;
  qty: number;
  uom: string; // viene de DB, por eso string
};

type RouteContext = {
  params: Promise<{ id: string }>;
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

export async function POST(_req: NextRequest, { params }: RouteContext) {
  await dbConnect();

  const { id } = await params;

  const reservation = await StockReservation.findById(id);
  if (!reservation) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  if (reservation.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Reservation is not ACTIVE" }, { status: 400 });
  }

  try {
    const lines = (reservation.lines as unknown as ReservationLineShape[]).map((l) => ({
      itemId: typeof l.itemId === "string" ? l.itemId : l.itemId.toString(),
      qty: l.qty,
      uom: toUom(l.uom),
    }));

    await applyReservation({
      action: "UNRESERVE",
      warehouseId: reservation.warehouseId.toString(),
      lines,
      ref: reservation.ref,
      note: "Release reservation",
    });

    reservation.status = "RELEASED";
    await reservation.save();

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: errorMessage(e) }, { status: 400 });
  }
}
