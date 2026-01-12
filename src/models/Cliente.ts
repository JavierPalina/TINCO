import mongoose, { Schema, Document } from "mongoose";

export interface ICliente extends Document {
  nombreCompleto: string;
  email?: string;
  telefono: string;

  // Compatibilidad: texto libre (podés dejarlo o ir migrando al ref)
  empresa?: string;

  // Nuevo: empresa asignada (relación)
  empresaAsignada?: mongoose.Schema.Types.ObjectId;

  direccionEmpresa?: string;
  ciudadEmpresa?: string;
  paisEmpresa?: string;
  razonSocial?: string;
  contactoEmpresa?: string;
  cuil?: string;

  prioridad: string;
  origenContacto?: string;
  direccion?: string;
  pais?: string;
  dni?: string;
  ciudad?: string;
  notas?: string;

  etapa:
    | "Nuevo"
    | "Contactado"
    | "Cotizado"
    | "Negociación"
    | "Ganado"
    | "Perdido";

  vendedorAsignado: mongoose.Schema.Types.ObjectId;

  motivoRechazo?: string;
  detalleRechazo?: string;
}

const ClienteSchema: Schema = new Schema(
  {
    nombreCompleto: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    telefono: { type: String, required: true, trim: true },

    empresa: { type: String, trim: true }, // legacy

    empresaAsignada: { type: Schema.Types.ObjectId, ref: "Empresa" }, // NUEVO

    direccionEmpresa: { type: String, trim: true },
    ciudadEmpresa: { type: String, trim: true },
    paisEmpresa: { type: String, trim: true },
    razonSocial: { type: String, trim: true },
    contactoEmpresa: { type: String, trim: true },
    cuil: { type: String, trim: true },

    prioridad: { type: String, trim: true, default: "Media" },
    origenContacto: { type: String, trim: true },

    direccion: { type: String, trim: true },
    pais: { type: String, trim: true },
    dni: { type: String, trim: true },
    ciudad: { type: String, trim: true },
    notas: { type: String, trim: true },

    etapa: {
      type: String,
      required: true,
      enum: [
        "Nuevo",
        "Contactado",
        "Cotizado",
        "Negociación",
        "Ganado",
        "Perdido",
      ],
      default: "Nuevo",
    },

    vendedorAsignado: { type: Schema.Types.ObjectId, ref: "User", required: true },

    motivoRechazo: { type: String, trim: true },
    detalleRechazo: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Cliente ||
  mongoose.model<ICliente>("Cliente", ClienteSchema);
