"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Cliente: seguís usando tu combobox2 (no lo cambio para no romperte estilos/props)
import { Combobox as Combobox2 } from "../ui/combobox2";

// Sucursal: como tu ejemplo, combobox “estándar”
import { Combobox } from "@/components/ui/combobox";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Client } from "@/types/client";
import { useSucursales } from "@/features/sucursales/sucursales.queries";

type Etapa = {
  _id: string;
  nombre: string;
  color: string;
};

type SessionUserSucursal = { sucursal?: string };

type FormInputs = {
  // cliente
  cliente: string;
  newClient?: {
    nombreCompleto: string;
    telefono: string;
    email: string;
  };

  // cotización
  montoTotal: number; // Precio (entero, sin centavos)
  etapa: string; // Columna/Etapa inicial

  // sucursal (ID)
  sucursalId: string;

  // opcionales
  tipoAbertura?: string;
  comoNosConocio?: string;
};

// --- Helpers: formateo AR (miles con ".") y parseo sin centavos
const formatARSInteger = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

const parseDigitsToNumber = (raw: string) => {
  // deja solo dígitos
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;

  // evita números absurdos si pegan un string enorme
  const trimmed = digits.slice(0, 15);
  return Number(trimmed);
};

export function CreateQuoteDialog() {
  const [open, setOpen] = useState(false);
  const [clienteMode, setClienteMode] = useState<"seleccionar" | "crear">(
    "seleccionar"
  );

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { control, handleSubmit, register, reset, setValue, getValues } =
    useForm<FormInputs>({
      defaultValues: {
        montoTotal: 0,
        sucursalId: "",
      },
    });

  // ---- Clientes
  const { data: clientes, isLoading: isLoadingClientes } = useQuery<Client[]>({
    queryKey: ["clientes"],
    queryFn: async () => (await axios.get("/api/clientes")).data.data,
  });

  const clienteOptions =
    clientes?.map((c) => ({ value: c._id, label: c.nombreCompleto })) || [];

  // ---- Etapas (columna inicial)
  const { data: etapas, isLoading: isLoadingEtapas } = useQuery<Etapa[]>({
    queryKey: ["etapasCotizacion"],
    queryFn: async () => (await axios.get("/api/etapas-cotizacion")).data.data,
  });

  const etapaOptions =
    etapas?.map((e) => ({ value: e._id, label: e.nombre })) || [];

  // ---- Sucursales (como AddClientDialog)
  const {
    data: sucursales = [],
    isLoading: sucursalesLoading,
    isError: sucursalesError,
  } = useSucursales();

  const opcionesDeSucursal = useMemo(() => {
    return sucursales.map((s) => ({ value: s._id, label: s.nombre }));
  }, [sucursales]);

  const bloquearSucursal = sucursalesLoading || sucursalesError;

  // Al abrir: setear sucursal por default desde el usuario o primera sucursal
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
    mutationFn: async (formData: FormInputs) => {
      let clienteId = formData.cliente;

      // 1) Crear cliente si corresponde
      if (clienteMode === "crear") {
        if (
          !formData.newClient?.nombreCompleto ||
          !formData.newClient?.telefono
        ) {
          throw new Error(
            "Nombre y teléfono son obligatorios para un nuevo cliente."
          );
        }
        const clientResponse = await axios.post(
          "/api/clientes",
          formData.newClient
        );
        clienteId = clientResponse.data.data._id;
      }

      if (!clienteId) throw new Error("Debe seleccionar o crear un cliente.");
      if (!formData.etapa)
        throw new Error("Debe seleccionar la columna inicial.");

      if (!formData.sucursalId?.trim()) {
        throw new Error("Debe seleccionar una sucursal.");
      }

      if (
        typeof formData.montoTotal !== "number" ||
        !Number.isFinite(formData.montoTotal)
      ) {
        throw new Error("Precio inválido.");
      }

      // 2) Crear cotización/lead
      const quoteData = {
        cliente: clienteId,
        montoTotal: formData.montoTotal,
        etapa: formData.etapa,
        sucursalId: formData.sucursalId,

        tipoAbertura: formData.tipoAbertura,
        comoNosConocio: formData.comoNosConocio,
      };

      return axios.post("/api/cotizaciones", quoteData);
    },
    onSuccess: () => {
      toast.success("Lead y cotización inicial creados con éxito.");
      queryClient.invalidateQueries({ queryKey: ["cotizacionesPipeline"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      reset({ montoTotal: 0, sucursalId: "" });
      setOpen(false);
      setClienteMode("seleccionar");
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err.message ?? "Error al crear el lead.");
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crear Lead</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Captura Rápida de Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Modo cliente */}
          <RadioGroup
            value={clienteMode}
            onValueChange={(value: "seleccionar" | "crear") =>
              setClienteMode(value)
            }
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="seleccionar"
                id="seleccionar"
                className="peer sr-only"
              />
              <Label
                htmlFor="seleccionar"
                className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Cliente Existente
              </Label>
            </div>

            <div>
              <RadioGroupItem value="crear" id="crear" className="peer sr-only" />
              <Label
                htmlFor="crear"
                className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Nuevo Cliente
              </Label>
            </div>
          </RadioGroup>

          {clienteMode === "seleccionar" ? (
            <div className="space-y-2">
              <Label>Cliente Existente*</Label>
              <Controller
                name="cliente"
                control={control}
                rules={{ required: clienteMode === "seleccionar" }}
                render={({ field }) => (
                  <Combobox2
                    options={clienteOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar cliente..."
                    searchText={
                      isLoadingClientes ? "Cargando..." : "Buscar cliente..."
                    }
                  />
                )}
              />
            </div>
          ) : (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
              <h4 className="text-sm font-semibold">Datos del Nuevo Cliente</h4>

              <div className="space-y-2">
                <Label htmlFor="newClient.nombreCompleto">
                  Nombre y Apellido*
                </Label>
                <Input
                  id="newClient.nombreCompleto"
                  {...register("newClient.nombreCompleto", {
                    required: clienteMode === "crear",
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newClient.telefono">Teléfono / WhatsApp*</Label>
                  <Input
                    id="newClient.telefono"
                    {...register("newClient.telefono", {
                      required: clienteMode === "crear",
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newClient.email">Email</Label>
                  <Input
                    id="newClient.email"
                    type="email"
                    {...register("newClient.email")}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Precio + Etapa inicial */}
          <div className="pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montoTotal">Precio*</Label>

                {/* INPUT FORMATEADO (sin centavos) */}
                <Controller
                  name="montoTotal"
                  control={control}
                  rules={{
                    required: true,
                    min: 0,
                    validate: (v) =>
                      Number.isFinite(v) ? true : "Precio inválido",
                  }}
                  render={({ field }) => {
                    const displayValue =
                      typeof field.value === "number"
                        ? formatARSInteger(field.value)
                        : "";

                    return (
                      <Input
                        id="montoTotal"
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={displayValue}
                        onChange={(e) => {
                          const num = parseDigitsToNumber(e.target.value);
                          field.onChange(num);
                        }}
                        onBlur={field.onBlur}
                      />
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Columna a colocar*</Label>
                <Controller
                  name="etapa"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Combobox2
                      options={etapaOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar etapa..."
                      searchText={
                        isLoadingEtapas ? "Cargando..." : "Buscar etapa..."
                      }
                    />
                  )}
                />
              </div>
            </div>

            {/* Sucursal (ID) como AddClientDialog */}
            <div className="space-y-2">
              <Label>Sucursal *</Label>

              <div
                className={bloquearSucursal ? "pointer-events-none opacity-60" : ""}
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

            {/* Campos extra */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Abertura de Interés</Label>
                <Input
                  placeholder="Ej: Corrediza, Puerta de entrada"
                  {...register("tipoAbertura")}
                />
              </div>

              <div className="space-y-2">
                <Label>¿Cómo nos conoció?</Label>
                <Input
                  placeholder="Ej: Instagram, Obra, Recomendación"
                  {...register("comoNosConocio")}
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Creando Lead..." : "Crear Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
