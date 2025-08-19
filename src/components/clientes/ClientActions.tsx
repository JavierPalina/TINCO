"use client";

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MoreHorizontal, Pencil, Trash2, MessageSquarePlus, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditClientDialog } from './EditClientDialog';
// For now, we link to the detail page, as adding modals here requires more state management
import { Client } from '@/types/client';
import { useRouter } from 'next/navigation';

export function ClientActions({ client }: { client: Client }) {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => axios.delete(`/api/clientes/${clientId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
  });

  const handleDelete = () => deleteMutation.mutate(client._id);
  
  const handleActionClick = (path: string) => {
    router.push(path);
  }

  return (
    <>
      <EditClientDialog client={client} isOpen={isEditDialogOpen} onOpenChange={setEditDialogOpen} />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente al cliente y todos sus datos asociados.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Sí, eliminar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />Editar Cliente</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Eliminar Cliente</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}