import mongoose, { Schema, Document } from 'mongoose';
import { ICliente } from './Cliente';
import { IUser } from './User';

interface IProductoCotizado {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface ICotizacion extends Document {
  cliente: ICliente['_id'];
  vendedor: IUser['_id'];
  // Un identificador único para la cotización, ej: "COT-001"
  codigo: string; 
  productos: IProductoCotizado[];
  montoTotal: number;
  estado: 'Enviada' | 'Aceptada' | 'Rechazada' | 'Borrador';
}

const CotizacionSchema: Schema = new Schema({
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
  vendedor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  codigo: { type: String, required: true, unique: true },
  productos: [{
    descripcion: { type: String, required: true },
    cantidad: { type: Number, required: true },
    precioUnitario: { type: Number, required: true },
  }],
  montoTotal: {
    type: Number,
    required: true,
  },
  estado: {
    type: String,
    required: true,
    enum: ['Enviada', 'Aceptada', 'Rechazada', 'Borrador'],
    default: 'Borrador',
  }
}, {
  timestamps: true
});

export default mongoose.models.Cotizacion || mongoose.model<ICotizacion>('Cotizacion', CotizacionSchema);