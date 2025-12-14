import { Schema, Types } from 'mongoose';

export const LogisticaSchema = new Schema(
  {
    // --- Metadatos de la Etapa ---
    estadoEntrega: {
      type: String,
      enum: ['Entregado', 'Parcial', 'Rechazado', 'Reprogramado', 'Pendiente'],
      default: 'Pendiente',
    },

    // Usuario / chofer asignado (ref a User)
    asignadoA: { type: Types.ObjectId, ref: 'User' },

    // N° de Orden de logística (se vincula con el proyecto / taller / depósito)
    numeroOrdenLogistica: {
      type: String,
    },

    // Cliente / Obra / Empresa (texto)
    clienteObraEmpresa: {
      type: String,
    },

    // Dirección de entrega / obra
    direccionEntregaObra: {
      type: String,
    },

    // Fecha programada de entrega
    // (en el form: fechaProgramadaEntrega)
    fechaProgramadaEntrega: { type: Date },

    // Responsable de logística / chofer (nombre mostrado en el form)
    responsableLogistica: {
      type: String,
    },

    // Fecha de cierre de entrega (se setea al completar, p.ej. estado = Entregado)
    fechaCierreEntrega: { type: Date },

    // --- Datos del Formulario ---

    // Tipo de entrega: Entrega a obra / Retiro en fábrica / Instalación directa
    tipoEntrega: { type: String },

    // Medio de transporte: Camión propio / Flete externo / Vehículo utilitario
    medioTransporte: { type: String },

    // Estado del pedido recibido del taller:
    // Completo / Parcial / Con faltantes / En revisión
    estadoPedidoRecibidoTaller: { type: String },

    // Verificación de embalaje: Correcto / Incompleto / Daños leves / Daños graves
    verificacionEmbalaje: { type: String },

    // Cantidad de bultos / aberturas
    cantidadBultos: { type: Number },
    
    // Hora de salida del Taller / Depósito
    horaSalida: { type: String },

    // Hora de llegada a domicilio / empresa / obra
    horaLlegada: { type: String },
    
    // Responsable que recibe en obra / cliente (nombre completo)
    responsableQueRecibe: { type: String },

    // Firma / comprobante del cliente / obra (URL de firma o referencia)
    firmaCliente: { type: String },

    // Firma del chofer / responsable de entrega (URL de firma o referencia)
    firmaChofer: { type: String },
    
    // Evidencias de entrega / instalación (fotos / videos)
    // En el form usamos evidenciasRaw -> evidenciasEntrega (array de strings)
    evidenciasEntrega: { type: [String], default: [] },

    // (Opcional) campo legacy si ya venías usando 'evidenciaEntrega'
    // evidenciaEntrega: { type: [String], default: [] },

    // Informe de logística (texto)
    informeLogistica: { type: String },

    // Áreas a notificar: Administración / Facturación / Vendedores / Postventa
    notificarA: {
      type: [String],
      default: [],
    },
  },
  { _id: false, timestamps: true },
);
