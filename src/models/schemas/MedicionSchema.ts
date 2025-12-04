// /models/schemas/MedicionSchema.ts
import { Schema, Types } from "mongoose";

// Sub-schema para cada medida tomada por abertura
const MedidaTomadaSchema = new Schema(
  {
    alto: { type: Number },
    ancho: { type: Number },
  },
  { _id: false },
);

export const MedicionSchema = new Schema(
  {
    // --- Metadatos internos de la etapa ---
    estado: {
      type: String,
      enum: ["Pendiente", "Completado", "Parcial", "Requiere nueva visita"],
      default: "Pendiente",
    },
    asignadoA: { type: Types.ObjectId, ref: "User" }, // Técnico que mide
    fechaMedicion: { type: Date },
    fechaCompletado: { type: Date },

    // --- Campos de identificación / cabecera ---
    numeroOrdenMedicion: { type: String }, // N° de orden de medición (puede ser distinto al numeroOrden general)
    clienteObraEmpresa: { type: String }, // Texto libre (lo mostramos en el view)
    direccionObra: { type: String }, // Dirección de obra (puede venir auto desde cliente/proyecto)

    // --- Datos principales de la medición ---
    tipoAberturaMedida: {
      type: String,
      enum: ["Ventana", "Puerta", "Corrediza", "Paño fijo", "Batiente"],
    },

    cantidadAberturasMedidas: { type: Number },

    // Repetidor "Medidas tomadas (por abertura)"
    medidasTomadas: [MedidaTomadaSchema],

    // Tolerancias / ajustes
    toleranciasRecomendadas: { type: String }, // Margen para fabricación o instalación

    // Condición de vanos (multiselect)
    condicionVanos: {
      type: [String],
      enum: [
        "Nivelado",
        "Desnivelado",
        "Con revoque",
        "Sin revoque",
        "Con marco existente",
      ],
      default: [],
    },

    // Estado de la obra al medir
    estadoObraMedicion: {
      type: String,
      enum: ["En construcción", "Terminada", "Refacción"],
    },

    // Tipo de perfil previsto
    tipoPerfilPrevisto: {
      type: String,
      enum: [
        "Módena (Aluar)",
        "A30 New (Aluar)",
        "A40 (Aluar)",
        "Herrero reforzado",
        "Tecnoperfiles Prime (PVC)",
        "Tecnoperfiles Advance (PVC)",
        "Rehau Synego (PVC)",
        "Rehau Euro-Design 60 (PVC)",
        "Deceuninck Zendow (PVC)",
        "Alcemar Línea 45 / 60 (Aluminio)",
      ],
    },

    // Color (texto libre + lógica de "agregar/quitar" la manejás en el front)
    color: { type: String },

    // Tipo de vidrio solicitado
    tipoVidrioSolicitado: {
      type: String,
      enum: ["Simple", "DVH", "Laminado", "Esmerilado", "Reflectivo"],
    },

    // Archivos
    planosAdjuntos: {
      type: [String],
      default: [],
    }, // URL de planos / croquis (máx. 3)
    fotosMedicion: {
      type: [String],
      default: [],
    }, // URLs de fotos de medición

    // Observaciones técnicas
    observacionesMedicion: { type: String }, // Inclinaciones, interferencias, detalles no visibles

    // Firma digital
    firmaValidacionTecnico: { type: String }, // URL firma

    // Estado final de la medición
    estadoFinalMedicion: {
      type: String,
      enum: ["Completada", "Parcial", "Requiere nueva visita"],
    },

    // Regla de pase a Verificación
    enviarAVerificacion: {
      type: String,
      enum: ["Sí", "No", "En revisión"],
    },
  },
  {
    _id: false,
    timestamps: true,
  },
);
