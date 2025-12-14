import { Schema, Types } from 'mongoose';

export const DepositoSchema = new Schema(
  {
    // --- Metadatos de la Etapa ---
    // Estado actual del pedido en depósito
    estadoInterno: { 
      type: String,
      enum: ['En depósito', 'Listo para entrega', 'En revisión', 'Devolución'],
      default: 'En depósito'
    },

    // Usuario responsable de recepción / gestión en depósito
    asignadoA: { type: Types.ObjectId, ref: 'User' },

    // N° de Orden de Depósito (vinculado con taller y logística)
    numeroOrdenDeposito: {
      type: String,
    },

    // Fecha de ingreso al depósito
    fechaIngreso: { type: Date },

    // Fecha de salida / entrega (para logística o cliente)
    fechaSalida: { type: Date },

    // --- Datos del Formulario ---
    // Origen del pedido: Taller / Proveedor / Devolución / Otro
    origenPedido: { type: String },

    // Estado del producto recibido
    // Correcto, Incompleto, Dañado, Con faltantes, En revisión, En reparación, ...
    estadoProductoRecibido: { type: String },

    // Cantidad de unidades
    cantidadUnidades: { type: Number },
    
    // Ubicación seleccionada (desplegable: Sector / Estantería / Nivel, etc.)
    ubicacionSeleccion: { type: String },

    // Campo texto para precisión de ubicación / datos internos
    ubicacionTexto: { type: String },

    // Identificación / código interno (A01, B03, C07, etiqueta, QR, etc.)
    codigoInterno: { type: String },
    
    // Verificación de embalaje (Correcto, Incompleto, Dañado, etc.)
    verificacionEmbalaje: { type: String },
    
    // Material almacenado: Aluminio / PVC / Vidrio / Herrajes / Otros
    materialAlmacenado: { type: String },

    // Observación cuando se selecciona "Otros"
    materialAlmacenadoObs: { type: String },

    // Control de medidas y piezas (check / detalle numérico)
    controlMedidasPiezas: { type: String },

    // Condición del vidrio: Sin daño / Rayado / Faltante / Reposición solicitada
    condicionVidrio: { type: String },
    
    // Fotos de ingreso al depósito (mínimo 2: bulto y etiqueta)
    fotosIngreso: { type: [String], default: [] },

    // Observaciones o Informe de depósito
    observaciones: { type: String },
  },
  { _id: false, timestamps: true },
);
