import mongoose, { Schema, Types } from "mongoose";

const RefSchema = new Schema(
  {
    kind: { type: String, enum: ["PO", "SO", "PROJECT", "QUOTE", "COUNT", "MANUAL", "PRODUCTION"] },
    id: { type: String },
  },
  { _id: false },
);

const StockMovementSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["IN", "OUT", "TRANSFER", "ADJUST", "RESERVE", "UNRESERVE", "PRODUCE"],
      required: true,
      index: true,
    },
    ref: { type: RefSchema },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location" },
    fromWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    fromLocationId: { type: Schema.Types.ObjectId, ref: "Location" },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    toLocationId: { type: Schema.Types.ObjectId, ref: "Location" },
    qty: { type: Number, required: true },
    uom: { type: String, enum: ["UN", "M", "M2", "KG"], required: true },
    unitCost: { type: Number, min: 0 },
    lot: { type: String, trim: true },
    serial: { type: String, trim: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: false },
);

StockMovementSchema.index({ createdAt: -1 });

export type StockMovementDoc = mongoose.InferSchemaType<typeof StockMovementSchema> & { _id: Types.ObjectId };

export default mongoose.models.StockMovement || mongoose.model("StockMovement", StockMovementSchema);
