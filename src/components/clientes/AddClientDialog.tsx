"use client";

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react'; // <-- 1. Importar useSession
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormInputs = {
  nombreCompleto: string;
  email: string;
  telefono: string;
};

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession(); // <-- 2. Obtener la sesión
  const { register, handleSubmit, reset } = useForm<FormInputs>();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (newClient: FormInputs & { vendedorAsignado: string }) => {
      return axios.post('/api/clientes', newClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      reset();
      setOpen(false);
    },
    onError: (error) => {
      console.error('Error al crear el cliente:', error);
    }
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    // 3. Verificar si hay una sesión y un ID de usuario
    if (!session?.user?.id) {
        alert("Error: Debes iniciar sesión para crear un cliente.");
        return;
    }

    // 4. Añadir el ID del vendedor logueado a los datos del formulario
    const clientData = {
        ...data,
        vendedorAsignado: session.user.id,
    };
    mutation.mutate(clientData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Nuevo Cliente</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombreCompleto" className="text-right">Nombre</Label>
              <Input id="nombreCompleto" {...register("nombreCompleto", { required: true })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" {...register("email")} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefono" className="text-right">Teléfono</Label>
              <Input id="telefono" {...register("telefono", { required: true })} className="col-span-3" />
            </div>
            {/* 5. Eliminamos el input del vendedor. ¡Ya no es necesario! */}
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}