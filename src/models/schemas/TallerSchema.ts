import { Schema, Types } from 'mongoose';

export const TallerSchema = new Schema(
  {
    // --- Metadatos de la Etapa ---
    estadoInterno: { // Estado *interno* de taller (Estado de Taller en el form)
      type: String, 
      enum: ['En proceso', 'Completo', 'En espera', 'Revisión', 'Rechazado'],
      default: 'En proceso'
    },

    // Técnico de taller (usuario responsable)
    asignadoA: { type: Types.ObjectId, ref: 'User' },

    // N° de orden de taller (vinculado al proyecto / flujo)
    numeroOrdenTaller: {
      type: String,
    },

    // Cliente / Obra / Empresa (texto simple que mostramos en el form)
    clienteObraEmpresa: {
      type: String,
    },

    // Fecha de ingreso al taller (en el form podés usar date o datetime-local)
    fechaIngreso: { type: Date },

    // Fecha estimada de finalización
    fechaEstimadaFinalizacion: { type: Date },

    // Fecha en que se dio como "Completado" Taller
    fechaCompletado: { type: Date },
    
    // --- Datos del Formulario ---
    // Tipo de abertura: Ventana / Puerta / Corrediza / Paño fijo / Batiente
    tipoAbertura: { type: String },

    // Material de perfil: Aluminio / PVC / Mixto / Otro
    materialPerfil: { 
      type: String, 
      enum: ['Aluminio', 'PVC', 'Mixto', 'Otro'],
    },

    // Tipo de perfil (texto libre o selección según material)
    tipoPerfil: { type: String },

    // Color (selección con opción de agregar nuevos)
    color: { type: String },

    // Vidrio a colocar: Simple / DVH / Laminado / Otro
    vidrioAColocar: { type: String },

    // Accesorios completos: Sí / No / Faltante parcial
    accesoriosCompletos: { type: String },

    // Material disponible: Completo / Parcial / Faltante crítico
    materialDisponible: { type: String },

    // Campo texto para especificar faltantes / detalle
    materialObs: { type: String },

    // Medidas verificadas: Sí / No / Revisión pendiente
    medidasVerificadas: { type: String },

    // Planos verificados: Sí / No / Modificación requerida
    planosVerificados: { type: String },
    
    // Informe de Taller (texto)
    informeTaller: { type: String },

    // Evidencias de armado (3 a 5 fotos / videos)
    evidenciasArmado: { type: [String], default: [] },

    // Control de calidad realizado por (usuario)
    controlCalidadPor: { type: Types.ObjectId, ref: 'User' },

    // Fecha de control de calidad
    fechaControlCalidad: { type: Date },

    // --- Campos para la Regla de Pase ---
    // Pedido listo para entrega: Sí / No / En revisión
    pedidoListoParaEntrega: { 
      type: String, 
      enum: ['Sí', 'No', 'En revisión'],
    },

    // Hacia dónde debe ir al marcar "listo para entrega"
    destinoFinal: { 
      type: String, 
      enum: ['Depósito', 'Logística', 'Instalación en obra', 'Retiro por cliente'],
    },
  },
  { _id: false, timestamps: true },
);
