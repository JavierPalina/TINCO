"use client";

import { useMemo, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";

type FormInputs = {
  nombreCompleto: string;
  email?: string;
  telefono: string;

  prioridad: "Alta" | "Media" | "Baja";
  origenContacto?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  dni?: string;
};

const defaultPrioridades = ["Alta", "Media", "Baja"];

export function AddClientDialog({
  prioridadesOptions,
}: {
  prioridadesOptions: string[];
}) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, control } = useForm<FormInputs>({
    defaultValues: {
      prioridad: "Media",
    },
  });

  const opcionesDePrioridad = useMemo(() => {
    const combined = [...new Set([...defaultPrioridades, ...prioridadesOptions])];
    return combined.map((p) => ({ value: p, label: p }));
  }, [prioridadesOptions]);

  const mutation = useMutation({
    mutationFn: (newClient: FormInputs & { vendedorAsignado: string }) => {
      return axios.post("/api/clientes", newClient);
    },
    onSuccess: (res) => {
      toast.success(`Cliente "${res.data.data.nombreCompleto}" creado con éxito.`);
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      reset({ prioridad: "Media" });
      setOpen(false);
    },
    onError: () => {
      toast.error("Error al crear el cliente", {
        description: "No se pudo guardar el cliente. Por favor, intenta de nuevo.",
      });
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (!session?.user?.id) return alert("You must be logged in.");
    mutation.mutate({ ...data, vendedorAsignado: session.user.id });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Cliente</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
            <DialogDescription>
              Completa la información para registrar un nuevo prospecto.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2">
              Información de Contacto
            </h3>

            <div className="space-y-2">
              <Label>Nombre Completo *</Label>
              <Input {...register("nombreCompleto", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input {...register("telefono", { required: true })} />
            </div>

            <div className="space-y-2">
              <Label>Email (Opcional)</Label>
              <Input type="email" {...register("email")} />
            </div>

            <div className="space-y-2">
              <Label>DNI</Label>
              <Input {...register("dni")} />
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input {...register("direccion")} />
            </div>

            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input {...register("ciudad")} />
            </div>

            <div className="space-y-2">
              <Label>País</Label>
              <Input {...register("pais")} />
            </div>

            <div className="space-y-2">
              <Label>Prioridad *</Label>
              <Controller
                name="prioridad"
                control={control}
                rules={{ required: "La prioridad es obligatoria" }}
                render={({ field }) => (
                  <Combobox
                    options={opcionesDePrioridad}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecciona o crea una prioridad..."
                  />
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Origen de Contacto</Label>
              <Input
                {...register("origenContacto")}
                placeholder="Ej: Instagram, Referido..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
