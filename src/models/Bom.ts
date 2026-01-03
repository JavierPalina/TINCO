import mongoose, { Schema, Types } from "mongoose";

const BomLineSchema = new Schema(
  {
    componentItemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    qty: { type: Number, required: true, min: 0 },
    uom: { type: String, enum: ["UN", "M", "M2", "KG"], required: true },
  },
  { _id: false },
);

const BomSchema = new Schema(
  {
    finishedItemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    version: { type: Number, required: true, min: 1, default: 1 },
    active: { type: Boolean, default: true, index: true },
    lines: { type: [BomLineSchema], required: true },
  },
  { timestamps: true },
);

BomSchema.index({ finishedItemId: 1, version: 1 }, { unique: true });

export type BomDoc = mongoose.InferSchemaType<typeof BomSchema> & { _id: Types.ObjectId };

export default mongoose.models.Bom || mongoose.model("Bom", BomSchema);
