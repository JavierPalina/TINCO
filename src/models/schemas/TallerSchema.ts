// /models/schemas/TallerSchema.ts
import { Schema, Types } from 'mongoose';

export const TallerSchema = new Schema(
  {
    // --- Metadatos de la Etapa ---
    estadoInterno: { // Estado *interno* de taller
      type: String, 
      enum: ['En proceso', 'Completo', 'En espera', 'Revisión', 'Rechazado'],
      default: 'En proceso'
    },
    asignadoA: { type: Types.ObjectId, ref: 'User' }, // Técnico de taller
    fechaIngreso: { type: Date },
    fechaEstimadaFinalizacion: { type: Date },
    fechaCompletado: { type: Date },
    
    // --- Datos del Formulario ---
    tipoAbertura: { type: String },
    materialPerfil: { type: String, enum: ['Aluminio', 'PVC', 'Mixto', 'Otro'] },
    tipoPerfil: { type: String },
    color: { type: String },
    vidrioAColocar: { type: String },
    
    accesoriosCompletos: { type: String },
    materialDisponible: { type: String },
    materialObs: { type: String }, // Campo texto para Faltante
    
    medidasVerificadas: { type: String },
    planosVerificados: { type: String },
    
    informeTaller: { type: String },
    evidenciasArmado: { type: [String], default: [] }, // Fotos/Videos
    
    controlCalidadPor: { type: Types.ObjectId, ref: 'User' },
    fechaControlCalidad: { type: Date },

    // --- Campos para la Regla de Pase ---
    pedidoListoParaEntrega: { type: String, enum: ['Sí', 'No', 'En revisión'] },
    destinoFinal: { // Hacia dónde debe ir
      type: String, 
      enum: ['Depósito', 'Logística', 'Instalación en obra', 'Retiro por cliente']
    },
  },
  { _id: false, timestamps: true },
);