import mongoose, { Schema, Document } from "mongoose";

export interface IProveedor extends Document {
  proveedorId?: string; // si querés un ID humano interno aparte del _id de Mongo
  cuit: string;

  razonSocial: string;
  nombreFantasia?: string;

  domicilio?: string; // Calle, número, depto, etc (texto libre)
  barrio?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;

  telefono?: string;
  email?: string;

  categoriaIVA?: string;
  fechaVtoCAI?: Date;
  inscriptoGanancias?: boolean;

  notas?: string;

  creadoPor: mongoose.Schema.Types.ObjectId;
}

const ProveedorSchema: Schema = new Schema(
  {
    proveedorId: { type: String, trim: true },

    cuit: { type: String, required: true, trim: true },

    razonSocial: { type: String, required: true, trim: true },
    nombreFantasia: { type: String, trim: true },

    domicilio: { type: String, trim: true },
    barrio: { type: String, trim: true },
    localidad: { type: String, trim: true },
    provincia: { type: String, trim: true },
    codigoPostal: { type: String, trim: true },

    telefono: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },

    categoriaIVA: { type: String, trim: true },
    fechaVtoCAI: { type: Date },
    inscriptoGanancias: { type: Boolean, default: false },

    notas: { type: String, trim: true },

    creadoPor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ProveedorSchema.index({ cuit: 1 });
ProveedorSchema.index({ razonSocial: 1 });

export default mongoose.models.Proveedor ||
  mongoose.model<IProveedor>("Proveedor", ProveedorSchema);
