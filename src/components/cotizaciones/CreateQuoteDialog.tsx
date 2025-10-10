"use client";

import { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '../ui/combobox2';
import { Client } from '@/types/client';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type FormInputs = {
  cliente: string;
  newClient?: {
    nombreCompleto: string;
    telefono: string;
    email: string;
  };
  tipoAbertura?: string;
  comoNosConocio?: string;
};

export function CreateQuoteDialog() {
  const [open, setOpen] = useState(false);
  const [clienteMode, setClienteMode] = useState<'seleccionar' | 'crear'>('seleccionar');
  const queryClient = useQueryClient();

  const { control, handleSubmit, register, reset } = useForm<FormInputs>();

  const { data: clientes, isLoading: isLoadingClientes } = useQuery<Client[]>({
    queryKey: ['clientes'],
    queryFn: async () => (await axios.get('/api/clientes')).data.data,
  });
    
  const mutation = useMutation({
    mutationFn: async (formData: FormInputs) => {
      let clienteId = formData.cliente;

      if (clienteMode === 'crear') {
        if (!formData.newClient?.nombreCompleto || !formData.newClient?.telefono) {
            throw new Error("Nombre y teléfono son obligatorios para un nuevo cliente.");
        }
        const clientResponse = await axios.post('/api/clientes', formData.newClient);
        clienteId = clientResponse.data.data._id;
      }
      
      if (!clienteId) throw new Error("Debe seleccionar o crear un cliente.");

      const quoteData = {
        cliente: clienteId,
        tipoAbertura: formData.tipoAbertura,
        comoNosConocio: formData.comoNosConocio,
      };
      
      return axios.post('/api/cotizaciones', quoteData);
    },
    onSuccess: () => {
      toast.success("Lead y cotización inicial creados con éxito.");
      queryClient.invalidateQueries({ queryKey: ['cotizacionesPipeline'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      reset();
      setOpen(false);
      setClienteMode('seleccionar');
    },
    onError: (error: any) => toast.error(error.message || "Error al crear el lead."),
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => mutation.mutate(data);

  const clienteOptions = clientes?.map(c => ({ value: c._id, label: c.nombreCompleto })) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Crear Lead</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Captura Rápida de Lead</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          <RadioGroup value={clienteMode} onValueChange={(value: 'seleccionar' | 'crear') => setClienteMode(value)} className="grid grid-cols-2 gap-4">
            <div><RadioGroupItem value="seleccionar" id="seleccionar" className="peer sr-only" /><Label htmlFor="seleccionar" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Cliente Existente</Label></div>
            <div><RadioGroupItem value="crear" id="crear" className="peer sr-only" /><Label htmlFor="crear" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">Nuevo Cliente</Label></div>
          </RadioGroup>

          {clienteMode === 'seleccionar' ? (
            <div className='space-y-2'>
              <Label>Cliente Existente*</Label>
              <Controller name="cliente" control={control} rules={{ required: clienteMode === 'seleccionar' }} render={({ field }) => (
                <Combobox options={clienteOptions} value={field.value} onChange={field.onChange} placeholder="Buscar cliente..." searchText={isLoadingClientes ? "Cargando..." : "Buscar cliente..."} />
              )} />
            </div>
          ) : (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <h4 className="text-sm font-semibold">Datos del Nuevo Cliente</h4>
                <div className="space-y-2">
                    <Label htmlFor="newClient.nombreCompleto">Nombre y Apellido*</Label>
                    <Input id="newClient.nombreCompleto" {...register("newClient.nombreCompleto", { required: clienteMode === 'crear' })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="newClient.telefono">Teléfono / WhatsApp*</Label>
                        <Input id="newClient.telefono" {...register("newClient.telefono", { required: clienteMode === 'crear' })} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newClient.email">Email</Label>
                        <Input id="newClient.email" type="email" {...register("newClient.email")} />
                    </div>
                </div>
            </div>
          )}

          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>Tipo de Abertura de Interés</Label>
                  <Input placeholder='Ej: Corrediza, Puerta de entrada' {...register("tipoAbertura")} />
              </div>
              <div className="space-y-2">
                  <Label>¿Cómo nos conoció?</Label>
                  <Input placeholder='Ej: Instagram, Obra, Recomendación' {...register("comoNosConocio")} />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Creando Lead..." : "Crear Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}