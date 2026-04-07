import mongoose, { Schema, Document } from 'mongoose';

export interface IEtapaCotizacion extends Document {
  nombre: string;
  color: string;
  systemKey?: "proyecto_por_iniciar" | "proyectos_no_realizados" | "proyecto_finalizado" | null;
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
    default: '#cccccc',
  },
  systemKey: {
    type: String,
    enum: [
      "proyecto_por_iniciar",
      "proyectos_no_realizados",
      "proyecto_finalizado",
      null,
    ],
    default: null,
    index: true,
  },
}, {
  timestamps: true
});

export default mongoose.models.EtapaCotizacion || mongoose.model<IEtapaCotizacion>('EtapaCotizacion', EtapaCotizacionSchema);
