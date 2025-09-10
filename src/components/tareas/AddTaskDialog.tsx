"use client";

import { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Combobox } from '@/components/ui/combobox';
import { CalendarIcon, Plus } from 'lucide-react';
import { Client } from '@/types/client';

type FormInputs = {
  titulo: string;
  descripcion?: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaVencimiento: Date;
  horaInicio?: string;
  horaFin?: string;
  cliente?: string;
};

export function AddTaskDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { register, control, handleSubmit, reset } = useForm<FormInputs>({
    defaultValues: {
      prioridad: 'Media',
      fechaVencimiento: new Date(),
    }
  });
  
  const { data: clientes } = useQuery<Client[]>({
    queryKey: ['clientes'],
    queryFn: async () => (await axios.get('/api/clientes')).data.data,
  });

const mutation = useMutation({
  mutationFn: (newTask: FormInputs) => {
    // CORRECCIÓN: Simplificar la preparación del payload
    const payload = {
      ...newTask,
      // Como la fecha siempre existe, la convertimos directamente a ISO string
      fechaVencimiento: newTask.fechaVencimiento.toISOString(),
    };
    return axios.post('/api/tareas', payload);
  },
  onSuccess: () => {
    toast.success("Tarea creada con éxito.");
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    reset();
    setOpen(false);
  },
  onError: () => toast.error("Error al crear la tarea.")
});

const onSubmit: SubmitHandler<FormInputs> = (data) => {
  mutation.mutate(data);
};

  const clienteOptions = clientes?.map(c => ({ value: c._id, label: c.nombreCompleto })) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          <span>Agregar Tarea</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>Crear Nueva Tarea</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2"><Label>Título *</Label><Input {...register("titulo", { required: true })} /></div>
          <div className="space-y-2"><Label>Descripción</Label><Textarea {...register("descripcion")} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Controller name="prioridad" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Media">Media</SelectItem>
                    <SelectItem value="Baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Controller name="fechaVencimiento" control={control} render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Selecciona fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                </Popover>
              )} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora Inicio</Label>
              <Input type="time" {...register("horaInicio")} />
            </div>
            <div className="space-y-2">
              <Label>Hora Fin</Label>
              <Input type="time" {...register("horaFin")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Asociar a Cliente (Opcional)</Label>
            <Controller name="cliente" control={control} render={({ field }) => (
              <Combobox options={clienteOptions} value={field.value ?? ""} onChange={field.onChange} placeholder="Buscar cliente..." />
            )} />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Guardando..." : "Guardar Tarea"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}