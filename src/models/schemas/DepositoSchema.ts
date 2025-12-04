// /models/schemas/DepositoSchema.ts
import { Schema, Types } from 'mongoose';

export const DepositoSchema = new Schema(
  {
    // --- Metadatos de la Etapa ---
    estadoInterno: { // Estado *interno* de depósito
      type: String,
      enum: ['En depósito', 'Listo para entrega', 'En revisión', 'Devolución'],
      default: 'En depósito'
    },
    asignadoA: { type: Types.ObjectId, ref: 'User' }, // Responsable de recepción
    fechaIngreso: { type: Date },
    fechaSalida: { type: Date },

    // --- Datos del Formulario ---
    origenPedido: { type: String },
    estadoProductoRecibido: { type: String },
    cantidadUnidades: { type: Number },
    
    ubicacionSeleccion: { type: String }, // Para el desplegable
    ubicacionTexto: { type: String }, // Para el campo texto
    codigoInterno: { type: String }, // Para Identificación
    
    verificacionEmbalaje: { type: String },
    
    materialAlmacenado: { type: String },
    materialAlmacenadoObs: { type: String }, // Para "Otros"

    controlMedidasPiezas: { type: String },
    condicionVidrio: { type: String },
    
    fotosIngreso: { type: [String], default: [] }, // Archivos
    observaciones: { type: String },
  },
  { _id: false, timestamps: true },
);