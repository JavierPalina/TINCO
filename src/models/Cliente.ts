import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface ICliente extends Document {
  nombreCompleto: string;
  empresa?: string;
  telefono: string;
  email?: string;
  // La etapa del pipeline de ventas
  etapa: 'Nuevo' | 'Contactado' | 'Cotizado' | 'Negociación' | 'Ganado' | 'Perdido';
  // Referencia al vendedor asignado
  vendedorAsignado: IUser['_id'];
  origen: string;
  // Campos para cuando un cliente se pierde
  motivoRechazo?: string;
  detalleRechazo?: string;
}

const ClienteSchema: Schema = new Schema({
  nombreCompleto: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio'],
    trim: true,
  },
  empresa: {
    type: String,
    trim: true,
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  etapa: {
    type: String,
    required: true,
    enum: ['Nuevo', 'Contactado', 'Cotizado', 'Negociación', 'Ganado', 'Perdido'],
    default: 'Nuevo',
  },
  vendedorAsignado: {
    // Esto crea una relación con el modelo User
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  origen: {
    type: String,
    default: 'Manual',
    trim: true,
  },
  motivoRechazo: {
    type: String,
    trim: true
  },
  detalleRechazo: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Cliente || mongoose.model<ICliente>('Cliente', ClienteSchema);