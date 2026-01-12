"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

  notas?: string;
};

// Payload hacia la API: fechaVtoCAI se manda como Date (o undefined)
type ProveedorApiPayload = Omit<ProveedorFormInputs, "fechaVtoCAI"> & {
  fechaVtoCAI?: Date;
};

export function AddProveedorDialog() {
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
      notas: "",
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
      toast.success("Proveedor creado");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["proveedores"] });
    },
    onError: () => {
      toast.error("Error al crear proveedor");
    },
  });

  const onSubmit: SubmitHandler<ProveedorFormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Nuevo Proveedor</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Proveedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-1">
              <Label>CUIT *</Label>
              <Input
                {...form.register("cuit", { required: true })}
                placeholder="20-XXXXXXXX-X"
              />
            </div>

            <div className="grid gap-1">
              <Label>ID de proveedor (opcional)</Label>
              <Input {...form.register("proveedorId")} placeholder="ID interno" />
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Razón Social *</Label>
              <Input {...form.register("razonSocial", { required: true })} />
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Nombre de fantasía</Label>
              <Input {...form.register("nombreFantasia")} />
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Domicilio</Label>
              <Input
                {...form.register("domicilio")}
                placeholder="Calle, número, depto, etc"
              />
            </div>

            <div className="grid gap-1">
              <Label>Barrio</Label>
              <Input {...form.register("barrio")} />
            </div>

            <div className="grid gap-1">
              <Label>Localidad</Label>
              <Input {...form.register("localidad")} />
            </div>

            <div className="grid gap-1">
              <Label>Provincia</Label>
              <Input {...form.register("provincia")} />
            </div>

            <div className="grid gap-1">
              <Label>Código Postal</Label>
              <Input {...form.register("codigoPostal")} />
            </div>

            <div className="grid gap-1">
              <Label>Teléfono</Label>
              <Input {...form.register("telefono")} />
            </div>

            <div className="grid gap-1">
              <Label>Correo electrónico</Label>
              <Input type="email" {...form.register("email")} />
            </div>

            <div className="grid gap-1">
              <Label>Categoría IVA</Label>
              <Input {...form.register("categoriaIVA")} />
            </div>

            <div className="grid gap-1">
              <Label>Fecha vto. C.A.I</Label>
              <Input type="date" {...form.register("fechaVtoCAI")} />
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Inscripto a las Ganancias (SI/NO)</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={String(form.watch("inscriptoGanancias") ?? false)}
                onChange={(e) =>
                  form.setValue("inscriptoGanancias", e.target.value === "true")
                }
              >
                <option value="false">No</option>
                <option value="true">Sí</option>
              </select>
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Notas</Label>
              <Input {...form.register("notas")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
