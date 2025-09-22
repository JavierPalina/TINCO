"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PlusCircle } from 'lucide-react'; // <-- 1. Importar el ícono

// 2. Importar DialogFooter y Button
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Client } from '@/types/client';

interface InteractionData {
  _id: string;
  tipo: string;
  nota: string;
  createdAt: string;
  usuario: { name: string; };
}

// 3. Agregar la nueva prop 'onAddNew'
type Props = {
  client: Client;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNew: () => void; // <-- La función para abrir el diálogo de añadir
}

export function ViewInteractionsDialog({ client, isOpen, onOpenChange, onAddNew }: Props) {
  const { data: interacciones, isLoading } = useQuery<InteractionData[]>({
    queryKey: ['interacciones', client._id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${client._id}/interacciones`);
      return data.data;
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de {client.nombreCompleto}</DialogTitle>
          <DialogDescription>Un registro de todos los puntos de contacto.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4">
          <div className="space-y-6 border-l-2 border-border pl-6 relative">
            {isLoading && <p>Cargando...</p>}
            {interacciones?.map(interaction => (
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
            ))}
            {interacciones?.length === 0 && !isLoading && (
              <p>No hay interacciones registradas.</p>
            )}
          </div>
        </div>
        
        {/* 4. Añadir el footer con el botón que usa 'onAddNew' */}
        <DialogFooter className="pt-4 border-t">
            <Button onClick={onAddNew} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Interacción
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}