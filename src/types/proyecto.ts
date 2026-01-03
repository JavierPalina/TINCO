import type { Types } from "mongoose";
import type { IVisitaTecnica } from "@/models/schemas/VisitaTecnicaSchema";
import type { ESTADOS_PROYECTO } from "@/models/Proyecto";

// Etapa genérica (igual que en tu model)
export interface IEtapaGenericaDTO {
  [key: string]: unknown;
}

// Si tu API devuelve ObjectId como string (lo normal en JSON), usá string.
// Si a veces devolvés populado, tipalo como unión.
export type IdLike = string;

export type EstadoProyectoDTO = (typeof ESTADOS_PROYECTO)[number] | null;

export type ClienteLite = {
  nombreCompleto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
};

export type VendedorLite = {
  name?: string;
  _id?: string;
};

export type ProyectoDTO = {
  _id: IdLike;

  numeroOrden: string;

  cliente: IdLike | ClienteLite | null;
  cotizacion?: IdLike | null;
  vendedor?: IdLike | VendedorLite | null;

  estadoActual?: EstadoProyectoDTO;

  visitaTecnica: Partial<IVisitaTecnica>;
  medicion: IEtapaGenericaDTO;
  verificacion: IEtapaGenericaDTO;
  taller: IEtapaGenericaDTO;
  deposito: IEtapaGenericaDTO;
  logistica: IEtapaGenericaDTO;

  createdAt?: string;
  updatedAt?: string;
};
