import mongoose, { Schema, Types } from "mongoose";

const RefSchema = new Schema(
  {
    kind: { type: String, enum: ["PO", "SO", "PROJECT", "QUOTE", "COUNT", "MANUAL", "PRODUCTION"], required: true },
    id: { type: String, required: true },
  },
  { _id: false },
);

const ReservationLineSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, enum: ["UN", "M", "M2", "KG"], required: true },
    lot: { type: String, trim: true },
  },
  { _id: false },
);

const StockReservationSchema = new Schema(
  {
    ref: { type: RefSchema, required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    lines: { type: [ReservationLineSchema], required: true },
    status: { type: String, enum: ["ACTIVE", "RELEASED", "CONSUMED"], default: "ACTIVE", index: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false },
);

StockReservationSchema.index({ "ref.kind": 1, "ref.id": 1, status: 1 });

export type StockReservationDoc = mongoose.InferSchemaType<typeof StockReservationSchema> & { _id: Types.ObjectId };

export default mongoose.models.StockReservation || mongoose.model("StockReservation", StockReservationSchema);
