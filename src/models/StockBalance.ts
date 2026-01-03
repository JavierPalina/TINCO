import mongoose, { Schema, Types } from "mongoose";

const StockBalanceSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: "Location" },
    onHand: { type: Number, required: true, default: 0 },
    reserved: { type: Number, required: true, default: 0 },
    updatedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

StockBalanceSchema.index(
  { itemId: 1, warehouseId: 1, locationId: 1 },
  { unique: true, partialFilterExpression: { locationId: { $exists: true } } },
);
StockBalanceSchema.index(
  { itemId: 1, warehouseId: 1 },
  { unique: true, partialFilterExpression: { locationId: { $exists: false } } },
);

export type StockBalanceDoc = mongoose.InferSchemaType<typeof StockBalanceSchema> & { _id: Types.ObjectId };

export default mongoose.models.StockBalance || mongoose.model("StockBalance", StockBalanceSchema);
