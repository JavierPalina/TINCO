"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, User as UserIcon } from 'lucide-react';
import { AddInteractionForm } from '@/components/clientes/AddInteractionForm';
import { ClientTasks } from '@/components/clientes/ClientTasks';
import { ClientQuotes } from '@/components/clientes/ClientQuotes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Vendedor {
  _id: string;
  name: string;
}

interface ClientData {
  _id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  etapa: string;
  vendedorAsignado: Vendedor;
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

  const { data: cliente, isLoading: isLoadingClient, error: clientError } = useQuery<ClientData>({
    queryKey: ['cliente', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${clientId}`);
      return data.data;
    },
    enabled: !!clientId,
  });

  const { data: interacciones, isLoading: isLoadingInteractions, error: interactionsError } = useQuery<InteractionData[]>({
    queryKey: ['interacciones', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${clientId}/interacciones`);
      return data.data;
    },
    enabled: !!clientId,
  });

  if (isLoadingClient || isLoadingInteractions) {
    return <div className="p-10 text-center">Cargando datos del cliente...</div>;
  }

  if (clientError || interactionsError || !cliente) {
    return <div className="p-10 text-center text-red-500">No se pudo encontrar al cliente o cargar sus datos.</div>;
  }

  return (
    <div className="container mx-auto py-10 grid md:grid-cols-3 gap-8 items-start">
      <div className="md:col-span-1 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{cliente.nombreCompleto}</CardTitle>
            <CardDescription>Etapa actual: <span className="font-semibold text-primary">{cliente.etapa}</span></CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{cliente.email || 'No disponible'}</span></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{cliente.telefono}</span></div>
            <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-muted-foreground" /> <span>Vendedor: {cliente.vendedorAsignado?.name || 'No asignado'}</span></div>
          </CardContent>
        </Card>
        
        <ClientTasks clientId={clientId} />

        <AddInteractionForm clientId={clientId} />
      </div>

      <div className="md:col-span-2 space-y-8">
        <ClientQuotes clientId={clientId} />

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