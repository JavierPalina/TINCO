"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// La estructura de un cliente (puedes moverla a un archivo de tipos)
interface Client {
  _id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  etapa: string;
  vendedorAsignado: string;
}

type FormInputs = Omit<Client, '_id' | 'etapa'>;

// El componente recibe el cliente a editar y controla su propia visibilidad
export function EditClientDialog({ client, isOpen, onOpenChange }: { client: Client, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { register, handleSubmit } = useForm<FormInputs>({
    defaultValues: { // Pre-llenamos el formulario con los datos del cliente
      nombreCompleto: client.nombreCompleto,
      email: client.email,
      telefono: client.telefono,
      vendedorAsignado: client.vendedorAsignado,
    }
  });
  
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (updatedClient: FormInputs) => {
      // Usamos el método PUT y la URL específica del cliente
      return axios.put(`/api/clientes/${client._id}`, updatedClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      onOpenChange(false); // Cierra el modal al tener éxito
    },
    onError: (error) => {
      console.error('Error al actualizar el cliente:', error);
      alert("Hubo un error al actualizar el cliente.");
    }
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Actualiza los datos del cliente. Los cambios se guardarán al confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombreCompleto" className="text-right">Nombre</Label>
              <Input id="nombreCompleto" {...register("nombreCompleto", { required: true })} className="col-span-3" />
            </div>
            {/* Repite para los otros campos... */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" {...register("email")} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">Teléfono</Label>
              <Input id="telefono" {...register("telefono", { required: true })} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Actualizando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}