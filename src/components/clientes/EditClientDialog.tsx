"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner"; // <-- 1. IMPORTAR TOAST
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/types/client';
import { CompanyDataDialog } from './CompanyDataDialog';
import { Pencil } from 'lucide-react';

type FormInputs = Omit<Client, '_id' | 'etapa' | 'vendedorAsignado' | 'createdAt' | 'ultimoContacto'>;

export function EditClientDialog({ client, isOpen, onOpenChange }: { client: Client, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { register, handleSubmit, control, getValues, setValue } = useForm<FormInputs>({
    defaultValues: client
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (updatedClient: FormInputs) => {
      return axios.put(`/api/clientes/${client._id}`, updatedClient);
    },
    onSuccess: () => {
      toast.success("Cliente actualizado con éxito");
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', client._id] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error al actualizar", {
        description: "No se pudieron guardar los cambios. Inténtalo de nuevo."
      });
    }
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => mutation.mutate(data);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Actualiza la información del cliente.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2">Información de Contacto</h3>
              <div className="space-y-2"><Label>Nombre Completo *</Label><Input {...register("nombreCompleto", { required: true })} /></div>
              <div className="space-y-2"><Label>Teléfono *</Label><Input {...register("telefono", { required: true })} /></div>
              <div className="space-y-2"><Label>Email (Opcional)</Label><Input type="email" {...register("email")} /></div>
              <div className="space-y-2"><Label>Dirección</Label><Input {...register("direccion")} /></div>
              <div className="space-y-2"><Label>Ciudad</Label><Input {...register("ciudad")} /></div>
              <div className="space-y-2"><Label>País Personal</Label><Input {...register("pais")} /></div>
              <div className="space-y-2">
                <Label>Prioridad *</Label>
                <Controller name="prioridad" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alta">Alta</SelectItem>
                      <SelectItem value="Media">Media</SelectItem>
                      <SelectItem value="Baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2"><Label>Origen de Contacto</Label><Input {...register("origenContacto")} /></div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}