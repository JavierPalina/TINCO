import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Bom from "@/models/Bom";
import { zProduce } from "@/lib/validation/stock";
import { applyMovement } from "@/lib/stock/ledger";

type Uom = "UN" | "M" | "M2" | "KG";

type BomLineShape = {
  componentItemId: { toString(): string } | string;
  qty: number;
  uom: Uom;
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

export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json();

  const parsed = zProduce.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const { finishedItemId, warehouseId, locationId, qty, overrideConsumeLines, ref, note } = parsed.data;

  const bom = await Bom.findOne({ finishedItemId, active: true }).sort({ version: -1 });
  if (!bom && !overrideConsumeLines) {
    return NextResponse.json({ ok: false, error: "No hay BOM activa para este producto" }, { status: 400 });
  }

  const consumeLines =
    overrideConsumeLines?.length
      ? overrideConsumeLines.map((l) => ({
          componentItemId: l.componentItemId,
          qty: l.qty,
          uom: l.uom as Uom, // si zProduce ya valida enum, idealmente tipalo ahí y quitas el "as"
          warehouseId: l.warehouseId ?? warehouseId,
          locationId: l.locationId,
        }))
      : (bom!.lines as unknown as BomLineShape[]).map((l) => ({
          componentItemId: typeof l.componentItemId === "string" ? l.componentItemId : l.componentItemId.toString(),
          qty: l.qty * qty,
          uom: l.uom,
          warehouseId,
          locationId: undefined,
        }));

  try {
    for (const l of consumeLines) {
      await applyMovement({
        type: "OUT",
        itemId: l.componentItemId,
        warehouseId: l.warehouseId,
        locationId: l.locationId,
        qty: l.qty,
        uom: l.uom,
        ref: ref ? { kind: ref.kind, id: ref.id } : { kind: "PRODUCTION", id: finishedItemId },
        note: note ?? "Consumo por producción",
      });
    }

    await applyMovement({
      type: "IN",
      itemId: finishedItemId,
      warehouseId,
      locationId,
      qty,
      uom: "UN",
      ref: ref ? { kind: ref.kind, id: ref.id } : { kind: "PRODUCTION", id: finishedItemId },
      note: note ?? "Ingreso por producción",
    });

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: errorMessage(e) }, { status: 400 });
  }
}
