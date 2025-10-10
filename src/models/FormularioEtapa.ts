import mongoose, { Schema, Document } from 'mongoose';

export interface ICampoFormulario {
  titulo: string;
  // ✅ Ampliamos los tipos de campo disponibles
  tipo: 'texto' | 'textarea' | 'numero' | 'fecha' | 'checkbox' | 'seleccion' | 'combobox' | 'archivo';
  opciones?: string[];
  requerido?: boolean;
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
      // ✅ Actualizamos el enum en el esquema
      tipo: { 
        type: String, 
        enum: ['texto', 'textarea', 'numero', 'fecha', 'checkbox', 'seleccion', 'combobox', 'archivo'], 
        required: true 
      },
      opciones: { type: [String] },
      requerido: { type: Boolean, default: false },
    },
  ],
}, {
  timestamps: true
});

export default mongoose.models.FormularioEtapa || mongoose.model<IFormularioEtapa>('FormularioEtapa', FormularioEtapaSchema);