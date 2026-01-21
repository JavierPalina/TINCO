"use client";

import { useMemo, useState, useEffect } from "react";
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

import { AddPrioridadDialog } from "@/components/prioridades/AddPrioridadDialog";
import { usePrioridades } from "@/features/prioridades/prioridades.queries";
import { useSucursales } from "@/features/sucursales/sucursales.queries";

type FormInputs = {
  nombreCompleto: string;
  email?: string;
  telefono: string;

  prioridad: string; // string (vacío al iniciar)
  sucursalId: string; // ID (como se envía ahora)

  origenContacto?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  dni?: string;
};

type SessionUserSucursal = { sucursal?: string };

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // PRIORIDADES
  const {
    data: prioridades = [],
    isLoading: prioridadesLoading,
    isError: prioridadesError,
  } = usePrioridades();

  const opcionesDePrioridad = useMemo(() => {
    const defaults = ["Alta", "Media", "Baja"];
    const nombresDb = prioridades.map((p) => p.nombre).filter(Boolean);
    const combined = Array.from(new Set([...defaults, ...nombresDb]));
    return combined.map((n) => ({ value: n, label: n }));
  }, [prioridades]);

  // SUCURSALES
  const {
    data: sucursales = [],
    isLoading: sucursalesLoading,
    isError: sucursalesError,
  } = useSucursales();

  const opcionesDeSucursal = useMemo(() => {
    return sucursales.map((s) => ({ value: s._id, label: s.nombre }));
  }, [sucursales]);

  const { register, handleSubmit, reset, control, setValue, getValues } =
    useForm<FormInputs>({
      defaultValues: {
        prioridad: "",
        sucursalId: "",
      },
    });

  // Al abrir: setea sucursalId con el ID del usuario (si existe)
  useEffect(() => {
    if (!open) return;

    const current = (getValues("sucursalId") ?? "").trim();
    if (current) return;

    const sucursalUsuarioId = (session?.user as unknown as SessionUserSucursal)
      ?.sucursal;

    if (sucursalUsuarioId?.trim()) {
      setValue("sucursalId", sucursalUsuarioId, { shouldValidate: true });
      return;
    }

    if (opcionesDeSucursal.length) {
      setValue("sucursalId", opcionesDeSucursal[0].value, {
        shouldValidate: true,
      });
    }
  }, [open, session, opcionesDeSucursal, setValue, getValues]);

  const mutation = useMutation({
    mutationFn: (newClient: FormInputs & { vendedorAsignado: string }) => {
      return axios.post("/api/clientes", newClient);
    },
    onSuccess: (res) => {
      toast.success(
        `Cliente "${res.data.data.nombreCompleto}" creado con éxito.`
      );
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      reset({ prioridad: "", sucursalId: "" });
      setOpen(false);
    },
    onError: () => {
      toast.error("Error al crear el cliente", {
        description:
          "No se pudo guardar el cliente. Por favor, intenta de nuevo.",
      });
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (!session?.user?.id) return alert("You must be logged in.");

    if (!data.sucursalId?.trim()) {
      toast.error("Sucursal requerida", {
        description: "Seleccioná una sucursal antes de guardar.",
      });
      return;
    }

    if (!data.prioridad?.trim()) {
      toast.error("Prioridad requerida", {
        description: "Seleccioná una prioridad antes de guardar.",
      });
      return;
    }

    mutation.mutate({ ...data, vendedorAsignado: session.user.id });
  };

  const bloquearPrioridad = prioridadesLoading || prioridadesError;
  const bloquearSucursal = sucursalesLoading || sucursalesError;

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

            {/* SUCURSAL (por ID) */}
            <div className="space-y-2">
              <Label>Sucursal *</Label>

              <div
                className={
                  bloquearSucursal ? "pointer-events-none opacity-60" : ""
                }
              >
                <Controller
                  name="sucursalId"
                  control={control}
                  rules={{ required: "La sucursal es obligatoria" }}
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

            {/* PRIORIDAD */}
            <div className="space-y-2 md:col-span-2">
              <Label>Prioridad *</Label>

              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <div
                  className={
                    bloquearPrioridad
                      ? "pointer-events-none opacity-60 flex-1 min-w-0"
                      : "flex-1 min-w-0"
                  }
                >
                  <Controller
                    name="prioridad"
                    control={control}
                    rules={{ required: "La prioridad es obligatoria" }}
                    render={({ field }) => (
                      <Combobox
                        options={opcionesDePrioridad}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={
                          prioridadesLoading
                            ? "Cargando prioridades..."
                            : prioridadesError
                            ? "Error cargando prioridades"
                            : "Selecciona una prioridad..."
                        }
                      />
                    )}
                  />
                </div>

                <div
                  className={
                    bloquearPrioridad ? "pointer-events-none opacity-60" : ""
                  }
                >
                  <AddPrioridadDialog
                    onCreated={(p) => {
                      setValue("prioridad", p.nombre, { shouldValidate: true });
                    }}
                  />
                </div>
              </div>
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
