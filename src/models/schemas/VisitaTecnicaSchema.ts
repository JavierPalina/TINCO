// /models/schemas/VisitaTecnicaSchema.ts
import { Schema, Types } from "mongoose";

export const ESTADOS_TAREA_VISITA = ["Aprobado", "Pendiente", "Rechazado"] as const;

export const RECOMENDACION_TECNICA_OPTIONS = [
  "Aprobado",
  "Revisión",
  "Requiere ajuste",
  "Postergar instalación",
] as const;

export type EstadoTareaVisita = (typeof ESTADOS_TAREA_VISITA)[number];
export type RecomendacionTecnica = (typeof RECOMENDACION_TECNICA_OPTIONS)[number];

export interface IMedidaTomada {
  alto: number;
  ancho: number;
  profundidad: number;
  largo: number;
  cantidad: number;
}

export interface IVisitaTecnica {
  asignadoA?: Types.ObjectId;
  fechaVisita?: Date;
  horaVisita?: string;
  tipoVisita?: string;

  direccion?: string;
  entrecalles?: string;
  otraInfoDireccion?: string;

  estadoObra?: string;
  condicionVanos?: string[];

  // 👉 ahora es array de objetos
  medidasTomadas?: IMedidaTomada[];

  tipoAberturaMedida?: string;

  materialSolicitado?: string;
  color?: string;
  vidriosConfirmados?: string;

  planosAdjuntos?: string[];
  fotosObra?: string[];

  firmaVerificacion?: string;
  observacionesTecnicas?: string;

  // 👉 nuevos enums
  recomendacionTecnica?: RecomendacionTecnica;
  estadoTareaVisita?: EstadoTareaVisita;
}

const MedidaTomadaSchema = new Schema<IMedidaTomada>(
  {
    alto: { type: Number },
    ancho: { type: Number },
    profundidad: { type: Number },
    largo: { type: Number },
    cantidad: { type: Number },
  },
  {
    _id: false,
  },
);

export const VisitaTecnicaSchema = new Schema<IVisitaTecnica>(
  {
    asignadoA: { type: Schema.Types.ObjectId, ref: "User" },
    fechaVisita: { type: Date },
    horaVisita: { type: String },
    tipoVisita: { type: String },

    direccion: { type: String },
    entrecalles: { type: String },
    otraInfoDireccion: { type: String },

    estadoObra: { type: String },
    condicionVanos: [{ type: String }],

    medidasTomadas: {
      type: [MedidaTomadaSchema],
      default: [],
    },

    tipoAberturaMedida: { type: String },

    materialSolicitado: { type: String },
    color: { type: String },
    vidriosConfirmados: { type: String },

    planosAdjuntos: {
      type: [String],
      default: [],
    },
    fotosObra: {
      type: [String],
      default: [],
    },

    firmaVerificacion: { type: String },
    observacionesTecnicas: { type: String },

    recomendacionTecnica: {
      type: String,
      enum: RECOMENDACION_TECNICA_OPTIONS,
    },
    estadoTareaVisita: {
      type: String,
      enum: ESTADOS_TAREA_VISITA,
    },
  },
  {
    _id: false, // subdocument embebido dentro de Proyecto
    timestamps: false,
  },
);
