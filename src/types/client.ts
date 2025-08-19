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
  prioridad: 'Alta' | 'Media' | 'Baja';
  etapa: string;
  createdAt: string;
  ultimoContacto?: string;
  vendedorAsignado: string;
  origenContacto?: string;
  direccion?: string;
  pais?: string;
  ciudad?: string;
  notas?: string;
}