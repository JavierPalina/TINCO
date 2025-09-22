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

interface NoteData {
  _id: string;
  contenido: string;
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

export function ViewNotesDialog({ client, isOpen, onOpenChange, onAddNew }: Props) {
  const { data: notas, isLoading } = useQuery<NoteData[]>({
    queryKey: ['notas', client._id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${client._id}/notas`);
      return data.data;
    },
    enabled: isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Notas de {client.nombreCompleto}</DialogTitle>
          <DialogDescription>Historial de anotaciones.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 space-y-4">
          {isLoading && <p>Cargando notas...</p>}
          {notas?.map(nota => (
            <div key={nota._id} className="p-3 rounded-md border bg-muted/50">
              <p className="text-sm">{nota.contenido}</p>
              <p className="text-xs text-muted-foreground mt-2 text-right">
                {format(new Date(nota.createdAt), "d MMM yyyy, HH:mm", { locale: es })} - por {nota.usuario?.name}
              </p>
            </div>
          ))}
          {notas?.length === 0 && !isLoading && <p className="text-sm text-center text-muted-foreground py-4">No hay notas registradas.</p>}
        </div>
        
        {/* 4. Añadir el footer con el botón que usa 'onAddNew' */}
        <DialogFooter className="pt-4 border-t">
            <Button onClick={onAddNew} variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Nueva Nota
            </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}