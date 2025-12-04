// /models/schemas/LogisticaSchema.ts
import { Schema, Types } from 'mongoose';

export const LogisticaSchema = new Schema(
  {
    // --- Metadatos de la Etapa ---
    estadoEntrega: {
      type: String,
      enum: ['Entregado', 'Parcial', 'Rechazado', 'Reprogramado', 'Pendiente'],
      default: 'Pendiente'
    },
    asignadoA: { type: Types.ObjectId, ref: 'User' }, // Responsable / Chofer
    fechaProgramada: { type: Date },
    fechaCierreEntrega: { type: Date }, // Se setea al completar

    // --- Datos del Formulario ---
    tipoEntrega: { type: String },
    medioTransporte: { type: String },
    estadoPedidoRecibido: { type: String },
    verificacionEmbalaje: { type: String },
    cantidadBultos: { type: Number },
    
    horaSalida: { type: String },
    horaLlegada: { type: String },
    
    responsableRecibeNombre: { type: String }, // Nombre del que recibe
    firmaCliente: { type: String }, // URL Signature
    firmaChofer: { type: String }, // URL Signature
    
    evidenciaEntrega: { type: [String], default: [] }, // Archivos
    informeLogistica: { type: String },
  },
  { _id: false, timestamps: true },
);