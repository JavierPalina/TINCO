// /models/schemas/VerificacionSchema.ts
import { Schema, Types } from "mongoose";

export const VerificacionSchema = new Schema(
  {
    // --- Metadatos de la etapa ---
    estado: {
      type: String,
      enum: ["Pendiente", "Completado", "Parcial", "Requiere nueva visita"],
      default: "Pendiente",
    },
    fechaCompletado: { type: Date },

    // --- Cabecera / contexto ---
    clienteObraEmpresa: { type: String }, // snapshot de nombre de cliente/obra/empresa
    direccionObra: { type: String }, // snapshot de dirección

    // --- Medidas y planos ---
    medidasVerificadas: {
      type: String,
      enum: ["Sí", "No", "Observaciones"],
    },
    medidasVerificadasObservaciones: { type: String }, // si eligieron "Observaciones"

    fuenteMedidas: {
      type: String, // listado en UI:
      //  Medición en obra propia, Plano del cliente, Plano del arquitecto / estudio, etc.
    },

    planosRevisados: {
      type: String, // listado en UI:
      //  Plano aprobado, aprobado con observaciones, etc.
    },
    fechaRevisionPlano: { type: Date }, // Fecha de revisión de plano

    // --- Materiales / lista de materiales ---
    materialesDisponiblesEstado: {
      type: String,
      enum: [
        "Sí",
        "No",
        "Faltan materiales",
        "Pendiente de ingreso",
        "En revisión",
      ],
    },
    materialesFaltantesDetalle: { type: String }, // campo texto cuando "Faltan materiales"
    materialesProveedorPendiente: { type: String }, // proveedor cuando "Pendiente de ingreso"

    listaMaterialesRevisada: {
      type: String,
      enum: ["Sí", "Pendiente", "No"],
    },

    // --- Accesorios / vidrios ---
    accesoriosCompletosEstado: {
      type: String,
      enum: [
        "Sí",
        "No",
        "Faltan accesorios",
        "Pendiente de recepción",
        "En revisión",
      ],
    },
    accesoriosFaltantesDetalle: { type: String }, // texto cuando "Faltan accesorios"

    vidriosDisponiblesEstado: {
      type: String,
      enum: ["Sí", "Pendiente", "No"],
    },

    // --- Color ---
    color: { type: String }, // valor libre, se maneja la lista en el front
    estadoColor: {
      type: String,
      enum: ["Sí", "No", "En revisión", "Pendiente de recepción"],
    },

    // --- Material / perfiles ---
    tipoMaterial: {
      type: String,
      enum: ["Aluminio", "PVC", "Mixto", "Otro"],
    },

    // Para MIXTO / OTRO (y también lo podés reutilizar en Aluminio / PVC)
    tipoPerfilVerificado: {
      type: String, // texto libre, el front muestra las opciones según tipoMaterial
    },
    proveedorPerfil: {
      type: String, // texto libre, con dropdown por material en el front
    },

    // Estado de los perfiles
    estadoPerfiles: {
      type: String,
      enum: [
        "Buen estado",
        "Golpeado",
        "Rayado",
        "Sucio",
        "Deformado",
        "Cortado incorrecto",
        "Faltante",
        "En revisión",
        "En reparación",
        "Rechazado",
      ],
    },

    // Compatibilidad y vidrios
    compatibilidadHerrajes: {
      type: String,
      enum: ["Sí", "No", "Revisión"],
    },

    medidasVidriosConfirmadas: {
      type: String,
      enum: ["Sí", "Pendiente", "No"],
    },

    // --- Planos / croquis adjuntos ---
    archivosPlanosCroquis: {
      type: [String], // URLs de archivos (Cloudinary, etc.)
      default: [],
    },

    // --- Usuario y fechas de verificación ---
    usuarioVerifico: {
      type: Types.ObjectId,
      ref: "User", // técnico de taller que verificó
    },

    fechaVerificacionCompleta: { type: Date }, // día que se finalizó el control

    // --- Observaciones y estado general ---
    observacionesVerificacion: { type: String },

    estadoGeneralVerificacion: {
      type: String,
      enum: ["Aprobado", "Con observaciones", "Rechazado"],
    },

    // --- Regla de pase a Taller ---
    aprobadoParaProduccion: {
      type: String,
      enum: ["Sí", "No"],
    },
  },
  {
    _id: false,
    timestamps: true,
  },
);
