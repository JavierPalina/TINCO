"use client";

import { useState, forwardRef } from 'react'; // <-- Import forwardRef
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { CSVLink } from "react-csv";
import { MoreHorizontal, Pencil, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditClientDialog } from './EditClientDialog';
import { Client } from '@/types/client';

// Define the CSV Headers here
const csvHeaders = [
    { label: "Nombre Completo", key: "nombreCompleto" },
    { label: "Teléfono", key: "telefono" },
    { label: "Email", key: "email" },
    { label: "Empresa", key: "empresa" },
    { label: "Prioridad", key: "prioridad" },
    { label: "Etapa", key: "etapa" },
];

export function ClientActions({ client, prioridadesOptions }: { client: Client, prioridadesOptions: string[] }) {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => axios.delete(`/api/clientes/${clientId}`),
    onSuccess: () => {
      toast.success("Cliente eliminado con éxito");
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: () => {
      toast.error("Error al eliminar el cliente.");
    }
  });

  const handleDelete = () => deleteMutation.mutate(client._id);
  
  return (
    <>
      <EditClientDialog 
        client={client} 
        isOpen={isEditDialogOpen} 
        onOpenChange={setEditDialogOpen}
        prioridadesOptions={prioridadesOptions}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción eliminará permanentemente al cliente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar Cliente
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <CSVLink
                data={[client]}
                headers={csvHeaders}
                filename={`cliente_${client.nombreCompleto.replace(/\s+/g, '_')}.csv`}
                className="flex items-center w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar Ficha
            </CSVLink>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4" />
            Eliminar Cliente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}