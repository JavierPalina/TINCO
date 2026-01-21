"use client";

import { useEffect } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Proveedor = {
  _id: string;
  proveedorId?: string;
  cuit?: string;
  razonSocial?: string;
  nombreFantasia?: string;

  domicilio?: string;
  barrio?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;

  telefono?: string;
  email?: string;

  categoriaIVA?: string;
  fechaVtoCAI?: string | Date;
  inscriptoGanancias?: boolean;
};

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
};

type ProveedorApiPayload = Omit<ProveedorFormInputs, "fechaVtoCAI"> & {
  fechaVtoCAI?: Date;
};

function toDateInputValue(v?: string | Date) {
  if (!v) return "";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function EditProveedorDialog({
  proveedor,
  isOpen,
  onOpenChange,
}: {
  proveedor: Proveedor;
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<ProveedorFormInputs>({
    defaultValues: {
      cuit: "",
      proveedorId: "",
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

  useEffect(() => {
    if (!isOpen) return;

    form.reset({
      cuit: proveedor.cuit || "",
      proveedorId: proveedor.proveedorId || "",
      razonSocial: proveedor.razonSocial || "",
      nombreFantasia: proveedor.nombreFantasia || "",
      domicilio: proveedor.domicilio || "",
      barrio: proveedor.barrio || "",
      localidad: proveedor.localidad || "",
      provincia: proveedor.provincia || "",
      codigoPostal: proveedor.codigoPostal || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
      categoriaIVA: proveedor.categoriaIVA || "",
      fechaVtoCAI: toDateInputValue(proveedor.fechaVtoCAI),
      inscriptoGanancias: Boolean(proveedor.inscriptoGanancias),
    });
  }, [isOpen, proveedor, form]);

  const mutation = useMutation({
    mutationFn: async (payload: ProveedorFormInputs) => {
      const body: ProveedorApiPayload = {
        ...payload,
        fechaVtoCAI: payload.fechaVtoCAI ? new Date(payload.fechaVtoCAI) : undefined,
      };
      return axios.put(`/api/proveedores/${proveedor._id}`, body);
    },
    onSuccess: async () => {
      toast.success("Proveedor actualizado con éxito.");
      await queryClient.invalidateQueries({ queryKey: ["proveedores"] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Error al actualizar el proveedor", {
        description: "No se pudo guardar el proveedor. Por favor, intenta de nuevo.",
      });
    },
  });

  const onSubmit: SubmitHandler<ProveedorFormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
          <DialogDescription>
            Actualiza los datos fiscales y de contacto del proveedor.
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
              <Input
                {...form.register("categoriaIVA")}
                placeholder="Ej: Responsable Inscripto"
              />
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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
