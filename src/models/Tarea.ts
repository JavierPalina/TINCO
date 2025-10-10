import mongoose, { Schema, Document } from 'mongoose';

export interface ITarea extends Document {
  titulo: string;
  descripcion?: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaVencimiento: Date;
  horaInicio?: string;
  horaFin?: string;
  completada: boolean;
  cliente?: mongoose.Schema.Types.ObjectId;
  vendedorAsignado: mongoose.Schema.Types.ObjectId;
}

const TareaSchema: Schema = new Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  prioridad: {
    type: String,
    enum: ['Alta', 'Media', 'Baja'],
    default: 'Baja',
  },
  fechaVencimiento: { type: Date, required: true },
  horaInicio: { type: String },
  horaFin: { type: String },
  completada: { type: Boolean, default: false },
  cliente: { type: Schema.Types.ObjectId, ref: 'Cliente' },
  vendedorAsignado: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true
});

export default mongoose.models.Tarea || mongoose.model<ITarea>('Tarea', TareaSchema);