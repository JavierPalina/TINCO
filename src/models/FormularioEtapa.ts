import mongoose, { Schema, Document } from 'mongoose';

// Interface para los campos dentro del formulario
export interface ICampoFormulario {
  titulo: string;
  tipo: 'texto' | 'seleccion' | 'numero' | 'fecha';
  opciones?: string[]; // Solo para el tipo 'seleccion'
}

// Interface para el documento del formulario de etapa
export interface IFormularioEtapa extends Document {
  etapaId: mongoose.Schema.Types.ObjectId;
  campos: ICampoFormulario[];
}

const FormularioEtapaSchema: Schema = new Schema({
  etapaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EtapaCotizacion', // Referencia al modelo de EtapaCotizacion
    required: true,
    unique: true,
  },
  campos: [
    {
      titulo: { type: String, required: true },
      tipo: { type: String, enum: ['texto', 'seleccion', 'numero', 'fecha'], required: true },
      opciones: { type: [String] },
    },
  ],
}, {
  timestamps: true
});

export default mongoose.models.FormularioEtapa || mongoose.model<IFormularioEtapa>('FormularioEtapa', FormularioEtapaSchema);