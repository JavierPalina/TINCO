"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/types/client';
import type { AxiosError } from 'axios';

type Props = { client: Client; isOpen: boolean; onOpenChange: (open: boolean) => void; }
type FormInputs = { contenido: string };

export function AddNoteDialog({ client, isOpen, onOpenChange }: Props) {
  const { register, handleSubmit, reset } = useForm<FormInputs>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // The data sent to axios.post must be an object like { contenido: "..." }
    mutationFn: (data: FormInputs) => axios.post(`/api/clientes/${client._id}/notas`, data),
    onSuccess: () => {
      toast.success("Nota añadida con éxito.");
      queryClient.invalidateQueries({ queryKey: ['notas', client._id] });
      reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ error: string }>;
      const errorMessage = axiosError.response?.data?.error || "No se pudo añadir la nota.";
      toast.error("Error", { description: errorMessage });
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Añadir Nota a {client.nombreCompleto}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Escribe tu nota aquí..." 
              {...register("contenido", { required: "El contenido no puede estar vacío." })} 
              rows={6} 
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar Nota"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}