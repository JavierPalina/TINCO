"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Notebook } from 'lucide-react';

interface Nota {
  _id: string;
  contenido: string;
  createdAt: string;
  usuario: {
    name: string;
  };
}

export function ClientNotes({ clientId }: { clientId: string }) {
  const { data: notas, isLoading } = useQuery<Nota[]>({
    queryKey: ['notas', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${clientId}/notas`);
      return data.data;
    },
    enabled: !!clientId,
  });

  if (isLoading) return <div>Cargando notas...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Notebook className="h-6 w-6" />
        Historial de Notas
      </h2>
      <div className="space-y-6 border-l-2 border-border pl-6 relative">
        {notas && notas.length > 0 ? (
          notas.map(nota => (
            <div key={nota._id} className="relative">
              <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-yellow-500" />
              <p className="text-sm text-muted-foreground">
                {format(new Date(nota.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                {' - por '}
                <span className="font-medium">{nota.usuario?.name || 'Usuario desconocido'}</span>
              </p>
              <p className="mt-2 text-sm bg-secondary/50 p-3 rounded-md">{nota.contenido}</p>
            </div>
          ))
        ) : (
          <div className="relative">
            <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-border" />
            <p className="text-muted-foreground pt-1">No hay notas registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
}