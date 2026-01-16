// src/models/User.ts
import mongoose, { Schema, Document, Types } from "mongoose";
import { ROLES, type UserRole } from "@/lib/roles";

export interface IPersonalData {
  cuil?: string;
  fechaNacimiento?: Date;
  nacionalidad?: string;
  estadoCivil?: "soltero" | "casado" | "divorciado" | "viudo";
  direccion?: {
    calle?: string;
    numero?: string;
    piso?: string;
    depto?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
}

export interface IContactData {
  telefonoPrincipal?: string;
  telefonoSecundario?: string;
  emailPersonal?: string;
  contactoEmergencia?: {
    nombre?: string;
    parentesco?: string;
    telefono?: string;
  };
}

export interface ILaboralData {
  puesto?: string;
  fechaIngreso?: Date;
  equipo?: string;
  reportaA?: string;
}

export interface IFinancieraLegalData {
  cbu?: string;
  banco?: string;
  obraSocial?: string;
  numeroAfiliado?: string;
}

export interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  rol: UserRole;
  activo: boolean;

  image?: string | null;

  // ✅ NUEVO
  sucursal?: Types.ObjectId | null;

  personalData?: IPersonalData;
  contactData?: IContactData;
  laboralData?: ILaboralData;
  financieraLegalData?: IFinancieraLegalData;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },

    rol: {
      type: String,
      required: true,
      enum: ROLES,
      default: "vendedor",
    },

    activo: { type: Boolean, default: true },

    image: { type: String, default: null },

    // ✅ NUEVO: sucursal asignada (puede ser null)
    sucursal: { type: Schema.Types.ObjectId, ref: "Sucursal", default: null },

    personalData: {
      cuil: String,
      fechaNacimiento: Date,
      nacionalidad: String,
      estadoCivil: String,
      direccion: {
        calle: String,
        numero: String,
        piso: String,
        depto: String,
        ciudad: String,
        provincia: String,
        codigoPostal: String,
      },
    },

    contactData: {
      telefonoPrincipal: String,
      telefonoSecundario: String,
      emailPersonal: String,
      contactoEmergencia: {
        nombre: String,
        parentesco: String,
        telefono: String,
      },
    },

    laboralData: {
      puesto: String,
      fechaIngreso: Date,
      equipo: String,
      reportaA: String,
    },

    financieraLegalData: {
      cbu: String,
      banco: String,
      obraSocial: String,
      numeroAfiliado: String,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
