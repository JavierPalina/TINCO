"use client";

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Client } from '@/types/client';

interface Props {
  client: Client;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormInputs = {
  titulo: string;
  fechaVencimiento: Date;
};

export function AddTaskDialog({ client, isOpen, onOpenChange }: Props) {
  const { control, register, handleSubmit, reset } = useForm<FormInputs>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newTask: FormInputs & { cliente: string }) => {
      return axios.post('/api/tareas', newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', client._id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      reset();
      onOpenChange(false);
    },
    onError: (error) => console.error("Error al añadir tarea:", error),
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    mutation.mutate({ ...data, cliente: client._id });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Tarea para {client.nombreCompleto}</DialogTitle>
          <DialogDescription>Agenda un seguimiento o una acción pendiente para este cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="titulo">Título de la Tarea</Label>
            <Input id="titulo" placeholder="Ej: Llamar para confirmar medidas" {...register("titulo", { required: true })} />
          </div>
          <div>
            <Label>Fecha de Vencimiento</Label>
            <Controller
              name="fechaVencimiento"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Agendando..." : "Agendar Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}