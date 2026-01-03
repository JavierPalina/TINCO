import mongoose, { Schema, Types } from "mongoose";

const WarehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["MAIN", "WORKSHOP", "JOB_SITE", "CONSIGNMENT"], required: true },
    address: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export type WarehouseDoc = mongoose.InferSchemaType<typeof WarehouseSchema> & { _id: Types.ObjectId };

export default mongoose.models.Warehouse || mongoose.model("Warehouse", WarehouseSchema);
