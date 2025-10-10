import mongoose, { Schema, Document } from 'mongoose';

export interface INota extends Document {
  cliente: mongoose.Schema.Types.ObjectId;
  usuario: mongoose.Schema.Types.ObjectId;
  contenido: string;
}

const NotaSchema: Schema = new Schema({
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
  contenido: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true
});

export default mongoose.models.Nota || mongoose.model<INota>('Nota', NotaSchema);