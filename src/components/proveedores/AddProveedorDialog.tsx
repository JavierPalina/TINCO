"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProveedorFormInputs = {
  proveedorId?: string;
  cuit: string;
  razonSocial: string;
  nombreFantasia?: string;

  domicilio?: string;
  barrio?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;

  telefono?: string;
  email?: string;

  categoriaIVA?: string;
  fechaVtoCAI?: string; // input type="date"
  inscriptoGanancias?: boolean;

  // notas?: string; // eliminado
};

// Payload hacia la API: fechaVtoCAI se manda como Date (o undefined)
type ProveedorApiPayload = Omit<ProveedorFormInputs, "fechaVtoCAI"> & {
  fechaVtoCAI?: Date;
};

export function AddProveedorDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<ProveedorFormInputs>({
    defaultValues: {
      cuit: "",
      razonSocial: "",
      nombreFantasia: "",
      domicilio: "",
      barrio: "",
      localidad: "",
      provincia: "",
      codigoPostal: "",
      telefono: "",
      email: "",
      categoriaIVA: "",
      fechaVtoCAI: "",
      inscriptoGanancias: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: ProveedorFormInputs) => {
      const body: ProveedorApiPayload = {
        ...payload,
        fechaVtoCAI: payload.fechaVtoCAI ? new Date(payload.fechaVtoCAI) : undefined,
      };
      return axios.post("/api/proveedores", body);
    },
    onSuccess: async () => {
      toast.success("Proveedor creado con éxito.");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      setOpen(false);
    },
    onError: () => {
      toast.error("Error al crear el proveedor", {
        description: "No se pudo guardar el proveedor. Por favor, intenta de nuevo.",
      });
    },
  });

  const onSubmit: SubmitHandler<ProveedorFormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Proveedor</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Proveedor</DialogTitle>
          <DialogDescription>
            Completa los datos fiscales y de contacto para registrar un nuevo proveedor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2">
              Datos Identificatorios
            </h3>

            <div className="space-y-2">
              <Label>CUIT *</Label>
              <Input
                {...form.register("cuit", { required: true })}
                placeholder="20-XXXXXXXX-X"
              />
            </div>

            <div className="space-y-2">
              <Label>ID de proveedor (opcional)</Label>
              <Input {...form.register("proveedorId")} placeholder="ID interno" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Razón Social *</Label>
              <Input {...form.register("razonSocial", { required: true })} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Nombre de fantasía</Label>
              <Input {...form.register("nombreFantasia")} />
            </div>

            <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2 mt-2">
              Domicilio
            </h3>

            <div className="space-y-2 md:col-span-2">
              <Label>Domicilio</Label>
              <Input
                {...form.register("domicilio")}
                placeholder="Calle, número, depto, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Barrio</Label>
              <Input {...form.register("barrio")} />
            </div>

            <div className="space-y-2">
              <Label>Localidad</Label>
              <Input {...form.register("localidad")} />
            </div>

            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input {...form.register("provincia")} />
            </div>

            <div className="space-y-2">
              <Label>Código Postal</Label>
              <Input {...form.register("codigoPostal")} />
            </div>

            <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2 mt-2">
              Contacto y Condición Fiscal
            </h3>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...form.register("telefono")} />
            </div>

            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input type="email" {...form.register("email")} />
            </div>

            <div className="space-y-2">
              <Label>Categoría IVA</Label>
              <Input {...form.register("categoriaIVA")} placeholder="Ej: Responsable Inscripto" />
            </div>

            <div className="space-y-2">
              <Label>Fecha vto. C.A.I</Label>
              <Input type="date" {...form.register("fechaVtoCAI")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Inscripto a las Ganancias</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={String(form.watch("inscriptoGanancias") ?? false)}
                onChange={(e) =>
                  form.setValue("inscriptoGanancias", e.target.value === "true")
                }
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando..." : "Crear Proveedor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
