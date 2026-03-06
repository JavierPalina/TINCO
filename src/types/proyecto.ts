import type { IVisitaTecnica } from "@/models/schemas/VisitaTecnicaSchema";
import type { ESTADOS_PROYECTO } from "@/models/Proyecto";

// Etapa genérica (igual que en tu model)
export interface IEtapaGenericaDTO {
  [key: string]: unknown;
}

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

// ✅ NUEVO (si lo vas a persistir en back)
export type PrioridadDTO = "Baja" | "Media" | "Alta" | "Urgente";
export type ProgresoEstadoDTO = "No iniciado" | "Iniciado" | "Finalizado";

export type ProyectoDTO = {
  _id: IdLike;

  numeroOrden: string;

  cliente: IdLike | ClienteLite | null;
  cotizacion?: IdLike | null;
  vendedor?: IdLike | VendedorLite | null;

  estadoActual?: EstadoProyectoDTO;

  // ✅ NUEVO (opcionales; no rompen si el back aún no los manda)
  prioridad?: PrioridadDTO | string | null;
  fechaLimite?: string | Date | null;
  tecnicoAsignado?: IdLike | { _id?: string; name?: string } | null;
  progresoEstado?: ProgresoEstadoDTO | string | null;

  visitaTecnica: Partial<IVisitaTecnica>;
  medicion: IEtapaGenericaDTO;
  verificacion: IEtapaGenericaDTO;
  taller: IEtapaGenericaDTO;
  deposito: IEtapaGenericaDTO;
  logistica: IEtapaGenericaDTO;

  createdAt?: string;
  updatedAt?: string;
};