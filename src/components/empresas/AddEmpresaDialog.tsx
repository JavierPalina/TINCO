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

  // notas?: string; // eliminado
};

export function AddEmpresaDialog() {
  const [open, setOpen] = useState(false);
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

  const mutation = useMutation({
    mutationFn: async (payload: EmpresaFormInputs) => axios.post("/api/empresas", payload),
    onSuccess: async () => {
      toast.success("Empresa creada con éxito.");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["empresas"] });
      await queryClient.invalidateQueries({ queryKey: ["empresas-lite"] });
      setOpen(false);
    },
    onError: () => {
      toast.error("Error al crear la empresa", {
        description: "No se pudo guardar la empresa. Por favor, intenta de nuevo.",
      });
    },
  });

  const onSubmit: SubmitHandler<EmpresaFormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva Empresa</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Empresa</DialogTitle>
          <DialogDescription>
            Completa la información comercial y de contacto para registrar una nueva empresa.
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

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando..." : "Crear Empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
