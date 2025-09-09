import mongoose, { Schema, Document } from 'mongoose';

export interface IEtapaCotizacion extends Document {
  nombre: string;
  color: string;
}

const EtapaCotizacionSchema: Schema = new Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    trim: true,
    default: '#cccccc', // Un color gris por defecto
  },
}, {
  timestamps: true
});

export default mongoose.models.EtapaCotizacion || mongoose.model<IEtapaCotizacion>('EtapaCotizacion', EtapaCotizacionSchema);