"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
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
import { Combobox } from "@/components/ui/combobox";

import { useSucursales } from "@/features/sucursales/sucursales.queries";

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

  sucursalId: string; // ObjectId
};

type ProveedorApiPayload = Omit<ProveedorFormInputs, "fechaVtoCAI"> & {
  fechaVtoCAI?: Date;
};

type SessionUserSucursal = { sucursal?: string };

function onlyDigits(value: string) {
  return (value ?? "").replace(/\D/g, "");
}

export function AddProveedorDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const {
    data: sucursales = [],
    isLoading: sucursalesLoading,
    isError: sucursalesError,
  } = useSucursales();

  const opcionesDeSucursal = useMemo(() => {
    return sucursales.map((s) => ({ value: s._id, label: s.nombre }));
  }, [sucursales]);

  const form = useForm<ProveedorFormInputs>({
    defaultValues: {
      proveedorId: "",
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
      sucursalId: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    const current = (form.getValues("sucursalId") ?? "").trim();
    if (current) return;

    const sucursalUsuarioId = (session?.user as unknown as SessionUserSucursal)
      ?.sucursal;

    if (sucursalUsuarioId?.trim()) {
      form.setValue("sucursalId", sucursalUsuarioId, { shouldValidate: true });
      return;
    }

    if (opcionesDeSucursal.length) {
      form.setValue("sucursalId", opcionesDeSucursal[0].value, {
        shouldValidate: true,
      });
    }
  }, [open, session, opcionesDeSucursal, form]);

  const mutation = useMutation({
    mutationFn: async (payload: ProveedorFormInputs) => {
      const body: ProveedorApiPayload = {
        ...payload,
        cuit: onlyDigits(payload.cuit),
        fechaVtoCAI: payload.fechaVtoCAI
          ? new Date(payload.fechaVtoCAI)
          : undefined,
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
        description:
          "No se pudo guardar el proveedor. Por favor, intenta de nuevo.",
      });
    },
  });

  const onSubmit: SubmitHandler<ProveedorFormInputs> = (data) => {
    if (!data.sucursalId?.trim()) {
      toast.error("Sucursal requerida", {
        description: "Seleccioná una sucursal antes de guardar.",
      });
      return;
    }
    if (onlyDigits(data.cuit).length !== 11) {
      toast.error("CUIT inválido", {
        description: "El CUIT debe tener 11 dígitos.",
      });
      return;
    }
    mutation.mutate(data);
  };

  const bloquearSucursal = sucursalesLoading || sucursalesError;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nuevo Proveedor</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Proveedor</DialogTitle>
          <DialogDescription>
            Completa los datos fiscales y de contacto para registrar un nuevo
            proveedor.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <h3 className="md:col-span-2 font-semibold text-lg border-b pb-2">
              Datos Identificatorios
            </h3>

            {/* SUCURSAL */}
            <div className="space-y-2">
              <Label>Sucursal *</Label>
              <div
                className={
                  bloquearSucursal ? "pointer-events-none opacity-60" : ""
                }
              >
                <Controller
                  name="sucursalId"
                  control={form.control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Combobox
                      options={opcionesDeSucursal}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={
                        sucursalesLoading
                          ? "Cargando sucursales..."
                          : sucursalesError
                          ? "Error cargando sucursales"
                          : "Selecciona una sucursal..."
                      }
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ID de proveedor (opcional)</Label>
              <Input {...form.register("proveedorId")} placeholder="ID interno" />
            </div>

            <div className="space-y-2">
              <Label>CUIT *</Label>
              <Input
                {...form.register("cuit", { required: true })}
                placeholder="20-XXXXXXXX-X"
              />
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
