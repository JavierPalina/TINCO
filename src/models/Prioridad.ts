import mongoose, { Schema, models, model } from "mongoose";

const PrioridadSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, unique: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type PrioridadDoc = {
  _id: string;
  nombre: string;
  activa: boolean;
};

export default models.Prioridad || model("Prioridad", PrioridadSchema);
