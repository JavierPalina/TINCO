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

type Empresa = {
  _id: string;
  razonSocial?: string;
  nombreFantasia?: string;

  domicilio?: string;
  barrio?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  pais?: string;

  telefono?: string;
  email?: string;

  cuit?: string;
  categoriaIVA?: string;
  inscriptoGanancias?: boolean;
};

type EmpresaFormInputs = {
  razonSocial: string;
  nombreFantasia?: string;

  domicilio?: string;
  barrio?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  pais?: string;

  telefono?: string;
  email?: string;

  cuit?: string;
  categoriaIVA?: string;
  inscriptoGanancias?: boolean;
};

export function EditEmpresaDialog({
  empresa,
  isOpen,
  onOpenChange,
}: {
  empresa: Empresa;
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<EmpresaFormInputs>({
    defaultValues: {
      razonSocial: "",
      nombreFantasia: "",
      domicilio: "",
      barrio: "",
      localidad: "",
      provincia: "",
      codigoPostal: "",
      pais: "",
      telefono: "",
      email: "",
      cuit: "",
      categoriaIVA: "",
      inscriptoGanancias: false,
    },
  });

  // Al abrir: cargamos valores actuales (misma UX que "crear" pero precargado)
  useEffect(() => {
    if (!isOpen) return;

    form.reset({
      razonSocial: empresa.razonSocial || "",
      nombreFantasia: empresa.nombreFantasia || "",
      domicilio: empresa.domicilio || "",
      barrio: empresa.barrio || "",
      localidad: empresa.localidad || "",
      provincia: empresa.provincia || "",
      codigoPostal: empresa.codigoPostal || "",
      pais: empresa.pais || "",
      telefono: empresa.telefono || "",
      email: empresa.email || "",
      cuit: empresa.cuit || "",
      categoriaIVA: empresa.categoriaIVA || "",
      inscriptoGanancias: Boolean(empresa.inscriptoGanancias),
    });
  }, [isOpen, empresa, form]);

  const mutation = useMutation({
    mutationFn: async (payload: EmpresaFormInputs) =>
      axios.put(`/api/empresas/${empresa._id}`, payload),
    onSuccess: async () => {
      toast.success("Empresa actualizada con éxito.");
      await queryClient.invalidateQueries({ queryKey: ["empresas"] });
      await queryClient.invalidateQueries({ queryKey: ["empresas-lite"] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Error al actualizar la empresa", {
        description: "No se pudo guardar la empresa. Por favor, intenta de nuevo.",
      });
    },
  });

  const onSubmit: SubmitHandler<EmpresaFormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Actualiza la información comercial y de contacto de la empresa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2">
              Identificación
            </h3>

            <div className="space-y-2 md:col-span-2">
              <Label>Razón Social *</Label>
              <Input {...form.register("razonSocial", { required: true })} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Nombre de fantasía</Label>
              <Input {...form.register("nombreFantasia")} />
            </div>

            <div className="space-y-2">
              <Label>CUIT</Label>
              <Input {...form.register("cuit")} placeholder="30-XXXXXXXX-X" />
            </div>

            <div className="space-y-2">
              <Label>Categoría IVA</Label>
              <Input {...form.register("categoriaIVA")} placeholder="Ej: Monotributo" />
            </div>

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

            <div className="space-y-2">
              <Label>País</Label>
              <Input {...form.register("pais")} />
            </div>

            <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2 mt-2">
              Contacto y Fiscal
            </h3>

            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input {...form.register("telefono")} />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
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
