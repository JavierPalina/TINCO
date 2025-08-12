import mongoose, { Schema, Document } from 'mongoose';
import { ICliente } from './Cliente';
import { IUser } from './User';

export interface IInteraccion extends Document {
  cliente: ICliente['_id'];
  usuario: IUser['_id'];
  tipo: 'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Nota';
  nota: string;
}

const InteraccionSchema: Schema = new Schema({
  cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true,
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tipo: {
    type: String,
    required: true,
    enum: ['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Nota'],
  },
  nota: {
    type: String,
    required: [true, 'La nota de la interacción es obligatoria'],
    trim: true,
  },
}, {
  timestamps: true
});

export default mongoose.models.Interaccion || mongoose.model<IInteraccion>('Interaccion', InteraccionSchema);