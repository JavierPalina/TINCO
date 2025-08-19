"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Client } from '@/types/client';

type Props = {
  client: Client;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotesDialog({ client, isOpen, onOpenChange }: Props) {
  const { register, handleSubmit } = useForm<{ notas?: string }>({
    defaultValues: { notas: client.notas || '' }
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { notas?: string }) => {
      return axios.put(`/api/clientes/${client._id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', client._id] });
      onOpenChange(false);
    },
  });

  const onSubmit: SubmitHandler<{ notas?: string }> = (data) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Notas sobre {client.nombreCompleto}</DialogTitle>
            <DialogDescription>Añade o edita notas generales sobre este cliente.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea {...register("notas")} rows={10} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar Notas"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}