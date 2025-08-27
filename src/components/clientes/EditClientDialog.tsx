"use client";

import React, { useState, useMemo } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/types/client';
import { CompanyDataDialog } from './CompanyDataDialog';
import { Pencil } from 'lucide-react';
import { Combobox } from '../ui/combobox';

// 1. El componente ahora recibe la lista de prioridades
interface EditDialogProps {
    client: Client;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    prioridadesOptions: string[];
}

type FormInputs = Omit<Client, '_id' | 'etapa' | 'vendedorAsignado' | 'createdAt' | 'ultimoContacto' | 'datosEmpresa'>;

const defaultPrioridades = ["Alta", "Media", "Baja"];

export function EditClientDialog({ client, isOpen, onOpenChange, prioridadesOptions }: EditDialogProps) {
  const { register, handleSubmit, control, getValues, setValue } = useForm<FormInputs>({
    defaultValues: client
  });
  const [isCompanyDialogOpen, setCompanyDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // 2. Combinamos las prioridades por defecto con las que vienen de la DB
  const opcionesDePrioridad = useMemo(() => {
    const combined = [...new Set([...defaultPrioridades, ...prioridadesOptions])];
    return combined.map(p => ({ value: p, label: p }));
  }, [prioridadesOptions]);

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
              <div className="space-y-2"><Label>DNI</Label><Input {...register("dni")} /></div>
              <div className="space-y-2">
                <Label>Prioridad *</Label>
                <Controller
                  name="prioridad"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={opcionesDePrioridad}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecciona una prioridad..."
                    />
                  )}
                />
              </div>
              <div className="space-y-2"><Label>Origen de Contacto</Label><Input {...register("origenContacto")} /></div>
              <div className="space-y-2"><Label>Dirección</Label><Input {...register("direccion")} /></div>
              <div className="space-y-2"><Label>Ciudad</Label><Input {...register("ciudad")} /></div>
              <div className="space-y-2"><Label>País</Label><Input {...register("pais")} /></div>
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