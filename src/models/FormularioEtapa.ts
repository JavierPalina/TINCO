import mongoose, { Schema, Document } from 'mongoose';

export interface ICampoFormulario {
  titulo: string;
  tipo: 'texto' | 'seleccion' | 'numero' | 'fecha';
  opciones?: string[];
}

export interface IFormularioEtapa extends Document {
  etapaId: mongoose.Schema.Types.ObjectId;
  campos: ICampoFormulario[];
}

const FormularioEtapaSchema: Schema = new Schema({
  etapaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EtapaCotizacion',
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