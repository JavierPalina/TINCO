"use client";

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Client } from '@/types/client';

interface Props {
  client: Client;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormInputs = {
  tipo: 'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Nota';
  nota: string;
};

export function AddInteractionDialog({ client, isOpen, onOpenChange }: Props) {
  const { data: session } = useSession();
  const { control, register, handleSubmit, reset } = useForm<FormInputs>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newInteraction: FormInputs & { usuario: string }) => {
      return axios.post(`/api/clientes/${client._id}/interacciones`, newInteraction);
    },
    onSuccess: () => {
      // Invalidate both the client list (for 'ultimoContacto') and the specific client's interactions
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['interacciones', client._id] });
      reset();
      onOpenChange(false);
    },
    onError: (error) => console.error("Error al añadir interacción:", error),
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (!session?.user?.id) return alert("Debes iniciar sesión.");
    const interactionData = { ...data, usuario: session.user.id };
    mutation.mutate(interactionData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Interacción a {client.nombreCompleto}</DialogTitle>
          <DialogDescription>Registra un nuevo punto de contacto con este cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div>
            <Label>Tipo de Interacción</Label>
            <Controller name="tipo" control={control} rules={{ required: true }} render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Llamada">Llamada</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Reunión">Reunión</SelectItem>
                  <SelectItem value="Nota">Nota</SelectItem>
                </SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <Label htmlFor="nota">Nota</Label>
            <Textarea id="nota" placeholder="Escribe los detalles de la interacción aquí..." {...register("nota", { required: true })} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Registrando..." : "Registrar Interacción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}