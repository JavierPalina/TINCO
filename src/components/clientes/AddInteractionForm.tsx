"use client";

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormInputs {
  tipo: 'Llamada' | 'WhatsApp' | 'Email' | 'Reunión' | 'Nota';
  nota: string;
}

export function AddInteractionForm({ clientId }: { clientId: string }) {
  const { data: session } = useSession();
  const { register, handleSubmit, reset, control } = useForm<FormInputs>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newInteraction: FormInputs & { usuario: string }) => {
      return axios.post(`/api/clientes/${clientId}/interacciones`, newInteraction);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interacciones', clientId] });
      reset();
    },
    onError: (error) => {
      console.error("Error al añadir interacción:", error);
    }
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (!session?.user?.id) {
        alert("Error: Debes iniciar sesión para registrar una interacción.");
        return;
    }
    
    const interactionData = {
      ...data,
      usuario: session.user.id,
    };
    mutation.mutate(interactionData);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Registrar Nueva Interacción</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            )}/>
          </div>
          <div>
            <Label htmlFor="nota">Nota</Label>
            <Textarea id="nota" placeholder="Escribe los detalles..." {...register("nota", { required: true })} />
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Registrando..." : "Registrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}