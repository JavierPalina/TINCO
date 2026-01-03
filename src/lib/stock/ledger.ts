// src/lib/stock/ledger.ts
import mongoose from "mongoose";
import StockBalance from "@/models/StockBalance";
import StockMovement from "@/models/StockMovement";
import Item from "@/models/Item";

type Ref = { kind: string; id: string } | undefined;

function balKey(
  itemId: mongoose.Types.ObjectId,
  warehouseId: mongoose.Types.ObjectId,
  locationId?: mongoose.Types.ObjectId,
) {
  return { itemId, warehouseId, ...(locationId ? { locationId } : {}) };
}

async function getOrCreateBalance(
  session: mongoose.ClientSession,
  itemId: mongoose.Types.ObjectId,
  warehouseId: mongoose.Types.ObjectId,
  locationId?: mongoose.Types.ObjectId,
) {
  const filter = balKey(itemId, warehouseId, locationId);

  const existing = await StockBalance.findOne(filter).session(session);
  if (existing) return existing;

  const created = await StockBalance.create(
    [
      {
        ...filter,
        onHand: 0,
        reserved: 0,
        updatedAt: new Date(),
      },
    ],
    { session },
  );

  return created[0];
}

export async function applyMovement(params: {
  type: "IN" | "OUT" | "ADJUST";
  itemId: string;
  warehouseId: string;
  locationId?: string;
  qty: number; // IN: +, OUT: +, ADJUST: +/- (ya viene con signo)
  uom: "UN" | "M" | "M2" | "KG";
  unitCost?: number;
  lot?: string;
  serial?: string;
  note?: string;
  ref?: Ref;
  createdBy?: string;
}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const item = await Item.findById(params.itemId).session(session);
    if (!item) throw new Error("Item not found");

    const itemId = new mongoose.Types.ObjectId(params.itemId);
    const warehouseId = new mongoose.Types.ObjectId(params.warehouseId);
    const locationId = params.locationId ? new mongoose.Types.ObjectId(params.locationId) : undefined;

    const bal = await getOrCreateBalance(session, itemId, warehouseId, locationId);

    // regla: no permitir available negativo en OUT / ADJUST negativo
    const deltaOnHand =
      params.type === "IN" ? params.qty : params.type === "OUT" ? -params.qty : params.qty;

    const newOnHand = bal.onHand + deltaOnHand;
    const newAvailable = newOnHand - bal.reserved;

    if ((params.type === "OUT" || (params.type === "ADJUST" && params.qty < 0)) && newAvailable < 0) {
      throw new Error("Stock insuficiente (available < 0)");
    }

    bal.onHand = newOnHand;
    bal.updatedAt = new Date();
    await bal.save({ session });

    await StockMovement.create(
      [
        {
          type: params.type,
          ref: params.ref,
          itemId,
          warehouseId,
          locationId,
          qty: deltaOnHand,
          uom: params.uom,
          unitCost: params.unitCost,
          lot: params.lot,
          serial: params.serial,
          note: params.note,
          createdBy: params.createdBy ? new mongoose.Types.ObjectId(params.createdBy) : undefined,
          createdAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return { ok: true };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function applyTransfer(params: {
  itemId: string;
  uom: "UN" | "M" | "M2" | "KG";
  qty: number;
  from: { warehouseId: string; locationId?: string };
  to: { warehouseId: string; locationId?: string };
  lot?: string;
  serial?: string;
  note?: string;
  ref?: Ref;
  createdBy?: string;
}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const itemId = new mongoose.Types.ObjectId(params.itemId);

    const fromWh = new mongoose.Types.ObjectId(params.from.warehouseId);
    const fromLoc = params.from.locationId ? new mongoose.Types.ObjectId(params.from.locationId) : undefined;

    const toWh = new mongoose.Types.ObjectId(params.to.warehouseId);
    const toLoc = params.to.locationId ? new mongoose.Types.ObjectId(params.to.locationId) : undefined;

    const fromBal = await getOrCreateBalance(session, itemId, fromWh, fromLoc);
    const toBal = await getOrCreateBalance(session, itemId, toWh, toLoc);

    const newFromOnHand = fromBal.onHand - params.qty;
    const newFromAvailable = newFromOnHand - fromBal.reserved;

    if (newFromAvailable < 0) throw new Error("Stock insuficiente en origen (available < 0)");

    fromBal.onHand = newFromOnHand;
    fromBal.updatedAt = new Date();
    await fromBal.save({ session });

    toBal.onHand = toBal.onHand + params.qty;
    toBal.updatedAt = new Date();
    await toBal.save({ session });

    await StockMovement.create(
      [
        {
          type: "TRANSFER",
          ref: params.ref,
          itemId,
          warehouseId: fromWh, // warehouseId principal del movimiento (origen)
          fromWarehouseId: fromWh,
          fromLocationId: fromLoc,
          toWarehouseId: toWh,
          toLocationId: toLoc,
          qty: params.qty,
          uom: params.uom,
          lot: params.lot,
          serial: params.serial,
          note: params.note,
          createdBy: params.createdBy ? new mongoose.Types.ObjectId(params.createdBy) : undefined,
          createdAt: new Date(),
        },
      ],
      { session },
    );

    await session.commitTransaction();
    return { ok: true };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}

export async function applyReservation(params: {
  action: "RESERVE" | "UNRESERVE";
  warehouseId: string;
  lines: { itemId: string; qty: number; uom: "UN" | "M" | "M2" | "KG"; locationId?: string }[];
  ref: Ref;
  note?: string;
  createdBy?: string;
}) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const whId = new mongoose.Types.ObjectId(params.warehouseId);

    for (const line of params.lines) {
      const itemId = new mongoose.Types.ObjectId(line.itemId);
      const locId = line.locationId ? new mongoose.Types.ObjectId(line.locationId) : undefined;

      const bal = await getOrCreateBalance(session, itemId, whId, locId);

      const deltaReserved = params.action === "RESERVE" ? line.qty : -line.qty;
      const newReserved = bal.reserved + deltaReserved;

      if (newReserved < 0) throw new Error("Reserved no puede ser negativo");

      const newAvailable = bal.onHand - newReserved;
      if (params.action === "RESERVE" && newAvailable < 0) throw new Error("Stock insuficiente para reservar");

      bal.reserved = newReserved;
      bal.updatedAt = new Date();
      await bal.save({ session });

      await StockMovement.create(
        [
          {
            type: params.action,
            ref: params.ref,
            itemId,
            warehouseId: whId,
            locationId: locId,
            qty: deltaReserved,
            uom: line.uom,
            note: params.note,
            createdBy: params.createdBy ? new mongoose.Types.ObjectId(params.createdBy) : undefined,
            createdAt: new Date(),
          },
        ],
        { session },
      );
    }

    await session.commitTransaction();
    return { ok: true };
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
}
