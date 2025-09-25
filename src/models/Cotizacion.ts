import mongoose, { Schema, Document, Types } from 'mongoose';

// Interface for the stage history with form data
export interface IHistorialEtapas {
  etapa: Types.ObjectId;
  fecha: Date;
  datosFormulario: Record<string, unknown>;
}

export interface ICotizacion extends Document {
  codigo: string;
  cliente: Types.ObjectId;
  vendedor: Types.ObjectId;
  etapa: Types.ObjectId;
  montoTotal: number;
  detalle?: string;
  productos: { descripcion: string; cantidad: number; precioUnitario: number }[];
  historialEtapas: IHistorialEtapas[];
  archivos: string[];
  orden: number;
}

const HistorialEtapasSchema: Schema = new Schema({
    etapa: { type: Schema.Types.ObjectId, ref: 'EtapaCotizacion', required: true },
    fecha: { type: Date, default: Date.now },
    // Cambio a Object para mayor compatibilidad
    datosFormulario: { type: Object, default: {} },
}, { _id: false });

const CotizacionSchema: Schema = new Schema({
  codigo: { type: String, required: true, unique: true },
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
  vendedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  etapa: {
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
  historialEtapas: [HistorialEtapasSchema],
  archivos: { type: [String], default: [] },
  orden: { type: Number, default: 0 },
}, {
  timestamps: true
});

export default mongoose.models.Cotizacion || mongoose.model<ICotizacion>('Cotizacion', CotizacionSchema);