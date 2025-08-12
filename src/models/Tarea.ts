import mongoose, { Schema, Document } from 'mongoose';
import { ICliente } from './Cliente';
import { IUser } from './User';

export interface ITarea extends Document {
  titulo: string;
  cliente?: ICliente['_id'];
  vendedorAsignado: IUser['_id'];
  fechaVencimiento: Date;
  completada: boolean;
}

const TareaSchema: Schema = new Schema({
  titulo: {
    type: String,
    required: [true, 'El título de la tarea es obligatorio'],
    trim: true,
  },
  cliente: {
    // Opcional, una tarea puede no estar ligada a un cliente
    type: Schema.Types.ObjectId,
    ref: 'Cliente', 
  },
  vendedorAsignado: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fechaVencimiento: {
    type: Date,
    required: true,
  },
  completada: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true
});

export default mongoose.models.Tarea || mongoose.model<ITarea>('Tarea', TareaSchema);