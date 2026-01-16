// /models/Sucursal.ts
import mongoose, { Schema, InferSchemaType, models, model } from "mongoose";

const SucursalSchema = new Schema(
  {
    nombre: { type: String, trim: true, default: "" },
    direccion: { type: String, required: true, trim: true },
    linkPagoAbierto: { type: String, trim: true, default: "" },
    cbu: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },

    // Imágenes como Data URI (base64) o URL
    qrPagoAbiertoImg: { type: String, default: "" },
    aliasImg: { type: String, default: "" },
  },
  { timestamps: true }
);

export type SucursalDoc = InferSchemaType<typeof SucursalSchema> & {
  _id: string;
};

export const Sucursal =
  models.Sucursal || model("Sucursal", SucursalSchema);
