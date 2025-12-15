import { Schema, Types } from "mongoose";

const TIPO_ENTREGA = ["Entrega a obra", "Retiro en fábrica", "Instalación directa"] as const;
const MEDIO_TRANSPORTE = ["Camión propio", "Flete externo", "Vehículo utilitario"] as const;
const ESTADO_PEDIDO_TALLER = ["Completo", "Parcial", "Con faltantes", "En revisión"] as const;
const VERIFICACION_EMBALAJE = ["Correcto", "Incompleto", "Daños leves", "Daños graves"] as const;
const ESTADO_ENTREGA = ["Entregado", "Parcial", "Rechazado", "Reprogramado", "Pendiente"] as const;

export const LogisticaSchema = new Schema(
  {
    estadoEntrega: {
      type: String,
      enum: ESTADO_ENTREGA,
      default: "Pendiente",
    },

    asignadoA: { type: Types.ObjectId, ref: "User" },

    numeroOrdenLogistica: { type: String },

    clienteObraEmpresa: { type: String, trim: true },
    direccionEntregaObra: { type: String, trim: true },

    fechaProgramadaEntrega: { type: Date },

    responsableLogistica: { type: String, trim: true },

    fechaCierreEntrega: { type: Date },

    tipoEntrega: { type: String, enum: TIPO_ENTREGA },
    medioTransporte: { type: String, enum: MEDIO_TRANSPORTE },
    estadoPedidoRecibidoTaller: { type: String, enum: ESTADO_PEDIDO_TALLER },
    verificacionEmbalaje: { type: String, enum: VERIFICACION_EMBALAJE },

    cantidadBultos: { type: Number, min: 0 },

    horaSalida: { type: String },
    horaLlegada: { type: String },

    responsableQueRecibe: { type: String, trim: true },

    firmaCliente: { type: String },
    firmaChofer: { type: String },

    evidenciasEntrega: { type: [String], default: [] },

    informeLogistica: { type: String },

    notificarA: { type: [String], default: [] },
  },
  { _id: false, timestamps: true },
);
