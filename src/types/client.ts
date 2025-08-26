export interface Client {
  _id: string;
  nombreCompleto: string;
  email?: string;
  telefono: string;
  empresa?: string;
  direccionEmpresa?: string;
  ciudadEmpresa?: string;
  paisEmpresa?: string;
  razonSocial?: string;
  contactoEmpresa?: string;
  cuil?: string;
  prioridad: string;
  etapa: string;
  createdAt: string;
  ultimoContacto?: string;
  vendedorAsignado: string;
  origenContacto?: string;
  direccion?: string;
  pais?: string;
  dni?: string;
  ciudad?: string;
  notas?: string;
}