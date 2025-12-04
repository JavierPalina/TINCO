import mongoose, { Schema, Document, Types } from 'mongoose';

import { VisitaTecnicaSchema, IVisitaTecnica } from './schemas/VisitaTecnicaSchema';
import { MedicionSchema } from './schemas/MedicionSchema';
import { VerificacionSchema } from './schemas/VerificacionSchema';
import { TallerSchema } from './schemas/TallerSchema';
import { DepositoSchema } from './schemas/DepositoSchema';
import { LogisticaSchema } from './schemas/LogisticaSchema';

export const ESTADOS_PROYECTO = [
  'Visita Técnica',
  'Medición',
  'Verificación',
  'Taller',
  'Depósito',
  'Logística',
  'Instalación',
  'Retiro Cliente',
  'Completado',
  'Pausado',
  'Rechazado',
];

export interface IProyecto extends Document {
  numeroOrden: string;
  cliente: Types.ObjectId;
  cotizacion?: Types.ObjectId;
  vendedor?: Types.ObjectId;
  estadoActual: string;

  visitaTecnica: IVisitaTecnica;
  medicion: any;     // si tenés interfaces, podés tiparlas también
  verificacion: any;
  taller: any;
  deposito: any;
  logistica: any;
}

const ProyectoSchema: Schema = new Schema(
  {
    numeroOrden: { type: String, unique: true },

    cliente: { type: Types.ObjectId, ref: 'Cliente', required: true },
    cotizacion: { type: Types.ObjectId, ref: 'Cotizacion' },
    vendedor: { type: Types.ObjectId, ref: 'User' },
    estadoActual: {
      type: String,
      enum: ESTADOS_PROYECTO,
      default: 'Visita Técnica',
    },

    visitaTecnica: { type: VisitaTecnicaSchema, default: () => ({}) },
    medicion: { type: MedicionSchema, default: () => ({}) },
    verificacion: { type: VerificacionSchema, default: () => ({}) },
    taller: { type: TallerSchema, default: () => ({}) },
    deposito: { type: DepositoSchema, default: () => ({}) },
    logistica: { type: LogisticaSchema, default: () => ({}) },
  },
  {
    timestamps: true,
  },
);

ProyectoSchema.pre('save', async function (next) {
  if (this.isNew && !this.numeroOrden) {
    try {
      const Model = this.constructor as mongoose.Model<IProyecto>;
      const ultimoProyecto = await Model.findOne({}, {}, { sort: { 'createdAt': -1 } });

      let nuevoNumero = 1;
      if (ultimoProyecto && ultimoProyecto.numeroOrden) {
        const match = ultimoProyecto.numeroOrden.match(/\d+$/);
        if (match) {
          nuevoNumero = parseInt(match[0]) + 1;
        }
      }
      
      this.numeroOrden = `OT-${nuevoNumero.toString().padStart(5, '0')}`;
      next();
      
    } catch (error: any) {
      next(error); // Pasa el error si algo falla en la generación
    }
  } else {
    next(); // No es nuevo o ya tiene un número, no hacer nada
  }
});

export default mongoose.models.Proyecto ||
  mongoose.model<IProyecto>('Proyecto', ProyectoSchema);