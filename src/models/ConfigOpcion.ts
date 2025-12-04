// /models/ConfigOpcion.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IConfigOpcion extends Document {
  tipo: string; // 'color', 'perfilAluminio', 'proveedorPerfil', 'ubicacionDeposito'
  valor: string;
}

const ConfigOpcionSchema: Schema = new Schema({
  tipo: { type: String, required: true, index: true },
  valor: { type: String, required: true },
}, { timestamps: true });

ConfigOpcionSchema.index({ tipo: 1, valor: 1 }, { unique: true });

export default mongoose.models.ConfigOpcion ||
  mongoose.model<IConfigOpcion>('ConfigOpcion', ConfigOpcionSchema);