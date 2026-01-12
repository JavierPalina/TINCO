import mongoose, { Schema, Document } from "mongoose";

export interface IEmpresa extends Document {
  razonSocial: string;
  nombreFantasia?: string;

  // Domicilio / Ubicación
  domicilio?: string; // Calle, número, depto, timbre, etc (texto libre)
  barrio?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  pais?: string;

  telefono?: string;
  email?: string;

  // Datos fiscales
  cuit?: string;
  categoriaIVA?: string;
  inscriptoGanancias?: boolean;

  // Interno
  notas?: string;
  creadoPor: mongoose.Schema.Types.ObjectId;
}

const EmpresaSchema: Schema = new Schema(
  {
    razonSocial: { type: String, required: true, trim: true },
    nombreFantasia: { type: String, trim: true },

    domicilio: { type: String, trim: true },
    barrio: { type: String, trim: true },
    localidad: { type: String, trim: true },
    provincia: { type: String, trim: true },
    codigoPostal: { type: String, trim: true },
    pais: { type: String, trim: true },

    telefono: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    cuit: { type: String, trim: true },
    categoriaIVA: { type: String, trim: true },
    inscriptoGanancias: { type: Boolean, default: false },

    notas: { type: String, trim: true },

    creadoPor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Índices recomendados
EmpresaSchema.index({ razonSocial: 1 });
EmpresaSchema.index({ cuit: 1 });

export default mongoose.models.Empresa ||
  mongoose.model<IEmpresa>("Empresa", EmpresaSchema);
