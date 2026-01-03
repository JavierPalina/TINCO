import mongoose, { Schema, Types } from "mongoose";

const MinStockSchema = new Schema(
  {
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    min: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ItemSchema = new Schema(
  {
    type: { type: String, enum: ["FINISHED", "COMPONENT", "SERVICE"], required: true },
    sku: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    uom: { type: String, enum: ["UN", "M", "M2", "KG"], required: true },
    track: {
      lot: { type: Boolean, default: false },
      serial: { type: Boolean, default: false },
    },
    attributes: { type: Schema.Types.Mixed },
    minStockByWarehouse: { type: [MinStockSchema], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type ItemDoc = mongoose.InferSchemaType<typeof ItemSchema> & { _id: Types.ObjectId };

export default mongoose.models.Item || mongoose.model("Item", ItemSchema);
