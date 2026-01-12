"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, User as UserIcon, Building, Globe, FileText, Hash, MapPin } from 'lucide-react';
import { AddInteractionForm } from '@/components/clientes/AddInteractionForm';
import { ClientTasks } from '@/components/clientes/ClientTasks';
import { ClientQuotes2 } from '@/components/clientes/ClientQuotes2';
import { ClientNotes } from '@/components/clientes/ClientNotes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

// Interfaces para tipado de datos
interface Vendedor {
  _id: string;
  name: string;
}

interface ClientData {
  _id: string;
  nombreCompleto: string;
  email?: string;
  telefono: string;
  etapa: string;
  vendedorAsignado: Vendedor;
  empresa?: string;
  direccionEmpresa?: string;
  ciudadEmpresa?: string;
  paisEmpresa?: string;
  razonSocial?: string;
  cuil?: string;
  prioridad: string;
  origenContacto?: string;
  direccion?: string;
  pais?: string;
  dni?: string;
  ciudad?: string;
}

interface InteractionData {
  _id: string;
  tipo: string;
  nota: string;
  createdAt: string;
  usuario: Vendedor;
}

export default function ClienteDetailPage() {
  const params = useParams();
  const clientId = params.id as string;

  // Query para obtener los datos del cliente
  const { data: cliente, isLoading: isLoadingClient, error: clientError } = useQuery<ClientData>({
    queryKey: ['cliente', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${clientId}`);
      return data.data;
    },
    enabled: !!clientId,
  });

  // Query para obtener las interacciones del cliente
  const { data: interacciones, isLoading: isLoadingInteractions, error: interactionsError } = useQuery<InteractionData[]>({
    queryKey: ['interacciones', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${clientId}/interacciones`);
      return data.data;
    },
    enabled: !!clientId,
  });

  // Estado de carga centralizado
  if (isLoadingClient || isLoadingInteractions) {
    return (
        <div className="flex justify-center items-center h-[calc(100vh-100px)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-lg">Cargando datos del cliente...</p>
        </div>
    );
  }

  // Estado de error
  if (clientError || interactionsError || !cliente) {
    return <div className="p-10 text-center text-red-500">No se pudo encontrar al cliente o cargar sus datos.</div>;
  }

  return (
    <div className="container mx-auto py-10 grid md:grid-cols-3 gap-8 items-start">
      {/* --- COLUMNA IZQUIERDA --- */}
      <div className="md:col-span-1 space-y-8">
        
        {/* Card de Información del Cliente */}
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl">{cliente.nombreCompleto}</CardTitle>
                <CardDescription>
                    Prioridad: <span className="font-semibold text-primary">{cliente.prioridad}</span>
                    {' | '} Origen: <span className="font-semibold text-primary">{cliente.origenContacto || 'N/A'}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-semibold mb-2 text-sm">Información de Contacto</h4>
                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{cliente.email || 'No disponible'}</span></div>
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{cliente.telefono}</span></div>
                        <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> <span>Vendedor: {cliente.vendedorAsignado?.name || 'No asignado'}</span></div>
                    </div>
                </div>
                
                {(cliente.dni || cliente.direccion) && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 text-sm">Datos Personales</h4>
                        <div className="grid gap-2 text-sm">
                            {cliente.dni && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" /> <span>DNI: {cliente.dni}</span></div>}
                            {cliente.direccion && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> <span>{cliente.direccion}, {cliente.ciudad}, {cliente.pais}</span></div>}
                        </div>
                    </div>
                )}

                {cliente.empresa && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 text-sm">Información de la Empresa</h4>
                        <div className="grid gap-2 text-sm">
                            <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> <span>{cliente.empresa}</span></div>
                            {cliente.razonSocial && <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> <span>Razón Social: {cliente.razonSocial}</span></div>}
                            {cliente.cuil && <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" /> <span>CUIT: {cliente.cuil}</span></div>}
                            {cliente.direccionEmpresa && <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /> <span>{cliente.direccionEmpresa}, {cliente.ciudadEmpresa}</span></div>}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {/* Componente de Tareas */}
        <ClientTasks clientId={clientId} />

        {/* Formulario para Añadir Interacción */}
        <AddInteractionForm clientId={clientId} />
      </div>

      {/* --- COLUMNA DERECHA --- */}
      <div className="md:col-span-2 space-y-8">
        
        {/* Componente de Cotizaciones del Cliente */}
        <ClientQuotes2 clientId={clientId} />

        {/* Componente de Notas del Cliente */}
        <ClientNotes clientId={clientId} />

        {/* Historial de Interacciones */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Historial de Interacciones</h2>
          <div className="space-y-6 border-l-2 border-border pl-6 relative">
            {interacciones && interacciones.length > 0 ? (
              interacciones.map(interaction => (
                <div key={interaction._id} className="relative">
                  <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-primary" />
                  <p className="font-semibold">{interaction.tipo}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(interaction.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                    {' - por '}
                    <span className="font-medium">{interaction.usuario?.name || 'Usuario desconocido'}</span>
                  </p>
                  <p className="mt-2 text-sm">{interaction.nota}</p>
                </div>
              ))
            ) : (
              <div className="relative">
                <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-border" />
                <p className="text-muted-foreground pt-1">No hay interacciones registradas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}