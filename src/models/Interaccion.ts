import mongoose, { Schema, Document } from 'mongoose';

// Interface for strong typing
export interface IInteraccion extends Document {
  cliente: mongoose.Schema.Types.ObjectId;
  usuario: mongoose.Schema.Types.ObjectId;
  tipo: 'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Nota';
  nota: string;
}

const InteraccionSchema: Schema = new Schema({
  cliente: {
    type: Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'El ID del cliente es obligatorio.'], // Validation message
  },
  usuario: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es obligatorio.'], // Validation message
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de interacción es obligatorio.'],
    // This enum ensures only these specific values are accepted
    enum: ['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Nota'],
  },
  nota: {
    type: String,
    required: [true, 'La nota de la interacción es obligatoria.'],
    trim: true,
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

export default mongoose.models.Interaccion || mongoose.model<IInteraccion>('Interaccion', InteraccionSchema);