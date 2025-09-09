import mongoose, { Schema, Document } from 'mongoose';

const HistorialEtapaSchema: Schema = new Schema({
  etapa: {
    type: Schema.Types.ObjectId,
    ref: 'EtapaCotizacion',
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

export interface ICotizacion extends Document {
  codigo: string;
  cliente: mongoose.Schema.Types.ObjectId;
  vendedor: mongoose.Schema.Types.ObjectId;
  etapa: mongoose.Schema.Types.ObjectId; // <-- CAMBIO
  montoTotal: number;
  detalle?: string;
  productos: { descripcion: string; cantidad: number; precioUnitario: number }[];
  historialEtapas: { etapa: mongoose.Schema.Types.ObjectId; fecha: Date }[];
  archivos: string[];
}

const CotizacionSchema: Schema = new Schema({
  codigo: { type: String, required: true, unique: true },
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
  vendedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  etapa: { // <-- CAMBIO
    type: Schema.Types.ObjectId,
    ref: 'EtapaCotizacion',
    required: true,
  },
  montoTotal: { type: Number, required: true },
  detalle: { type: String, trim: true },
  productos: [{
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioUnitario: { type: Number, required: true },
  }],
  historialEtapas: [HistorialEtapaSchema],
  archivos: { type: [String], default: [] },
}, {
  timestamps: true
});

export default mongoose.models.Cotizacion || mongoose.model<ICotizacion>('Cotizacion', CotizacionSchema);