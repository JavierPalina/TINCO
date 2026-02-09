import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHistorialEtapas {
  etapa: Types.ObjectId;
  fecha: Date;
  datosFormulario: Record<string, unknown>;
}

export interface IArchivoCotizacion {
  uid: string;
  url: string;
  publicId?: string;
  name?: string;
  createdAt?: Date;
}

export interface IFactura {
  uid: string;
  numero?: string;
  fecha?: Date;
  monto?: number;
  estado?: "pendiente" | "pagada" | "vencida" | "anulada";
  url?: string; // pdf o imagen
}

export interface IPago {
  uid: string;
  fecha?: Date;
  monto?: number;
  metodo?: string;
  referencia?: string;
  comprobanteUrl?: string; // ✅ solo imagen
}

export interface IImagenCotizacion {
  uid: string;
  url: string;
  caption?: string;
}

export interface IMaterialPedido {
  uid: string;
  descripcion: string;
  cantidad?: number;
  unidad?: string;
  estado?: "pendiente" | "pedido" | "recibido" | "cancelado";
}

export interface ITicketSoporte {
  uid: string;
  titulo: string;
  estado?: "abierto" | "en_progreso" | "cerrado";
  createdAt?: Date;
  descripcion?: string;
  url?: string;
}

export interface ICotizacion extends Document {
  codigo: string;
  nombre?: string;

  cliente: Types.ObjectId;
  vendedor: Types.ObjectId;
  etapa: Types.ObjectId;
  montoTotal: number;

  sucursalId?: Types.ObjectId;

  tipoAbertura?: string;
  comoNosConocio?: string;

  detalle?: string;
  productos: { descripcion: string; cantidad: number; precioUnitario: number }[];

  historialEtapas: IHistorialEtapas[];

  archivos: IArchivoCotizacion[];

  facturas?: IFactura[];
  pagos?: IPago[];
  imagenes?: IImagenCotizacion[];
  materialPedido?: IMaterialPedido[];
  tickets?: ITicketSoporte[];

  orden: number;
}

const HistorialEtapasSchema: Schema = new Schema(
  {
    etapa: { type: Schema.Types.ObjectId, ref: "EtapaCotizacion", required: true },
    fecha: { type: Date, default: Date.now },
    datosFormulario: { type: Object, default: {} },
  },
  { _id: false }
);

const ArchivoSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    name: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FacturaSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    numero: { type: String, trim: true },
    fecha: { type: Date },
    monto: { type: Number },
    estado: { type: String, enum: ["pendiente", "pagada", "vencida", "anulada"], default: "pendiente" },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const PagoSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    fecha: { type: Date },
    monto: { type: Number },
    metodo: { type: String, trim: true },
    referencia: { type: String, trim: true },
    comprobanteUrl: { type: String, trim: true },
  },
  { _id: false }
);

const ImagenSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true },
  },
  { _id: false }
);

const MaterialPedidoSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    descripcion: { type: String, required: true, trim: true },
    cantidad: { type: Number },
    unidad: { type: String, trim: true },
    estado: { type: String, enum: ["pendiente", "pedido", "recibido", "cancelado"], default: "pendiente" },
  },
  { _id: false }
);

const TicketSoporteSchema: Schema = new Schema(
  {
    uid: { type: String, required: true, index: true },
    titulo: { type: String, required: true, trim: true },
    estado: { type: String, enum: ["abierto", "en_progreso", "cerrado"], default: "abierto" },
    createdAt: { type: Date, default: Date.now },
    descripcion: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const CotizacionSchema: Schema = new Schema(
  {
    codigo: { type: String, required: true, unique: true },
    nombre: { type: String, trim: true, default: "" },

    cliente: { type: Schema.Types.ObjectId, ref: "Cliente", required: true },
    vendedor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    etapa: { type: Schema.Types.ObjectId, ref: "EtapaCotizacion", required: true },

    montoTotal: { type: Number, required: true },

    sucursalId: { type: Schema.Types.ObjectId, ref: "Sucursal" },

    tipoAbertura: { type: String, trim: true },
    comoNosConocio: { type: String, trim: true },

    detalle: { type: String, trim: true },

    productos: [
      {
        descripcion: { type: String, required: true },
        cantidad: { type: Number, required: true },
        precioUnitario: { type: Number, required: true },
      },
    ],

    historialEtapas: [HistorialEtapasSchema],

    archivos: { type: [ArchivoSchema], default: [] },

    facturas: { type: [FacturaSchema], default: [] },
    pagos: { type: [PagoSchema], default: [] },
    imagenes: { type: [ImagenSchema], default: [] },
    materialPedido: { type: [MaterialPedidoSchema], default: [] },
    tickets: { type: [TicketSoporteSchema], default: [] },

    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Cotizacion ||
  mongoose.model<ICotizacion>("Cotizacion", CotizacionSchema);
