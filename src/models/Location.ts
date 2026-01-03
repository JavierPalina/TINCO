import mongoose, { Schema, Types } from "mongoose";

const LocationSchema = new Schema(
  {
    warehouseId: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true, index: true },
    code: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ["STORAGE", "PICK", "QUARANTINE", "DAMAGED"], default: "STORAGE" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

LocationSchema.index({ warehouseId: 1, code: 1 }, { unique: true });

export type LocationDoc = mongoose.InferSchemaType<typeof LocationSchema> & { _id: Types.ObjectId };

export default mongoose.models.Location || mongoose.model("Location", LocationSchema);
