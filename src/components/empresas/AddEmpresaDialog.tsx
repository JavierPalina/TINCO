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

  notas?: string;
};

export function AddEmpresaDialog() {
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
      notas: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: EmpresaFormInputs) => {
      return axios.post("/api/empresas", payload);
    },
    onSuccess: async () => {
      toast.success("Empresa creada");
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["empresas"] });
      await queryClient.invalidateQueries({ queryKey: ["empresas-lite"] });
    },
    onError: () => {
      toast.error("Error al crear empresa");
    },
  });

  const onSubmit: SubmitHandler<EmpresaFormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Nueva Empresa</Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Empresa</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-1 md:col-span-2">
              <Label>Razón Social *</Label>
              <Input {...form.register("razonSocial", { required: true })} />
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Nombre de fantasía</Label>
              <Input {...form.register("nombreFantasia")} />
            </div>

            <div className="grid gap-1">
              <Label>CUIT</Label>
              <Input {...form.register("cuit")} placeholder="30-XXXXXXXX-X" />
            </div>

            <div className="grid gap-1">
              <Label>Categoría IVA</Label>
              <Input {...form.register("categoriaIVA")} />
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Domicilio</Label>
              <Input {...form.register("domicilio")} placeholder="Calle, número, depto, etc" />
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
              <Label>País</Label>
              <Input {...form.register("pais")} />
            </div>

            <div className="grid gap-1">
              <Label>Teléfono</Label>
              <Input {...form.register("telefono")} />
            </div>

            <div className="grid gap-1">
              <Label>Email</Label>
              <Input type="email" {...form.register("email")} />
            </div>

            <div className="grid gap-1 md:col-span-2">
              <Label>Inscripto a las Ganancias (SI/NO)</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={String(form.watch("inscriptoGanancias"))}
                onChange={(e) => form.setValue("inscriptoGanancias", e.target.value === "true")}
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
