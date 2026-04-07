// src/components/cotizaciones/CreateQuoteDialog.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios, { AxiosError } from "axios";
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

import { Combobox as Combobox2 } from "../ui/combobox2";
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
  cliente: string;
  newClient?: {
    nombreCompleto: string;
    telefono: string;
    email: string;
    direccion?: string;
    prioridad?: string;
  };
  montoTotal: number;
  etapa: string;
  sucursalId: string;
  tipoAbertura?: string;
  comoNosConocio?: string;
  tipoObra?: string;
  tipoObraCustom?: string;
};

// ── helpers ──────────────────────────────────────────────────────────────────

const formatARSInteger = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

const parseDigitsToNumber = (raw: string) => {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits.slice(0, 15));
};

/** Extrae un mensaje legible del error de duplicado de Mongo */
function parseDuplicateKeyError(errorMsg: string): string {
  // index: telefono_1  →  "teléfono"
  // index: email_1     →  "email"
  const match = errorMsg.match(/index:\s*(\w+)_\d+/);
  if (match) {
    const field = match[1];
    const fieldLabels: Record<string, string> = {
      telefono: "teléfono",
      email: "email",
      dni: "DNI",
      cuit: "CUIT",
    };
    const label = fieldLabels[field] ?? field;
    return `Ya existe un cliente con ese ${label}. Revisá los datos e intentá de nuevo.`;
  }
  return "Ya existe un cliente con esos datos. Revisá los campos e intentá de nuevo.";
}

// ─────────────────────────────────────────────────────────────────────────────

export function CreateQuoteDialog() {
  const [open, setOpen] = useState(false);
  const [clienteMode, setClienteMode] = useState<"seleccionar" | "crear">(
    "seleccionar"
  );
  const [tipoObraEsCustom, setTipoObraEsCustom] = useState(false);

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isValid },
  } = useForm<FormInputs>({
    mode: "onChange",          // validación en tiempo real → habilita/deshabilita botón
    defaultValues: {
      montoTotal: 0,
      sucursalId: "",
      tipoObra: "",
      tipoObraCustom: "",
      tipoAbertura: "",
      comoNosConocio: "",
      cliente: "",
      newClient: {
        nombreCompleto: "",
        telefono: "",
        email: "",
        direccion: "",
        prioridad: "Media",
      },
    },
  });

  // ── Clientes ───────────────────────────────────────────────────────────────

  const { data: clientes, isLoading: isLoadingClientes } = useQuery<Client[]>({
    queryKey: ["clientes"],
    queryFn: async () => (await axios.get("/api/clientes")).data.data,
  });

  const clienteOptions =
    clientes?.map((c) => ({ value: c._id, label: c.nombreCompleto })) || [];

  // ── Etapas ─────────────────────────────────────────────────────────────────

  const { data: etapas, isLoading: isLoadingEtapas } = useQuery<Etapa[]>({
    queryKey: ["etapasCotizacion"],
    queryFn: async () => (await axios.get("/api/etapas-cotizacion")).data.data,
  });

  const etapaOptions =
    etapas?.map((e) => ({ value: e._id, label: e.nombre })) || [];

  // ── Sucursales ─────────────────────────────────────────────────────────────

  const {
    data: sucursales = [],
    isLoading: sucursalesLoading,
    isError: sucursalesError,
  } = useSucursales();

  const opcionesDeSucursal = useMemo(
    () => sucursales.map((s) => ({ value: s._id, label: s.nombre })),
    [sucursales]
  );

  // ── Tipo de obra ───────────────────────────────────────────────────────────


  const TIPO_OBRA_OTRO = "__otro__";

  const { data: tiposObraConfig = [] } = useQuery<
    { _id: string; valor: string }[]
  >({
    queryKey: ["configuracion", "tipoObra"],
    queryFn: async () =>
      (await axios.get("/api/configuracion/tipoObra")).data.data as {
        _id: string;
        valor: string;
      }[],
  });

  const watchTipoObra = watch("tipoObra");

  const tipoObraOptions = useMemo(
    () => [
      { value: "Casa", label: "Casa" },
      { value: "Departamento", label: "Departamento" },
      { value: "Obra nueva", label: "Obra nueva" },
      { value: "Remodelación", label: "Remodelación" },
      { value: TIPO_OBRA_OTRO, label: "Otro…" },
    ],
    []
  );

  // ── Prioridad ──────────────────────────────────────────────────────────────

  const tipoObraOptionsWithSaved = useMemo(() => {
    const existing = new Set(
      tipoObraOptions.map((option) => option.value.trim().toLowerCase())
    );

    return [
      ...tipoObraOptions.filter((option) => option.value !== TIPO_OBRA_OTRO),
      ...tiposObraConfig
        .map((item) => item.valor.trim())
        .filter(Boolean)
        .filter((value) => !existing.has(value.toLowerCase()))
        .map((value) => ({ value, label: value })),
      { value: TIPO_OBRA_OTRO, label: "Otro..." },
    ];
  }, [tipoObraOptions, tiposObraConfig]);

  const prioridadOptions = useMemo(
    () => [
      { value: "Alta", label: "Alta" },
      { value: "Media", label: "Media" },
      { value: "Baja", label: "Baja" },
      { value: "Compleja", label: "Compleja" },
    ],
    []
  );

  const bloquearSucursal = sucursalesLoading || sucursalesError;

  // ── Pre-setear sucursal al abrir ──────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const current = (getValues("sucursalId") ?? "").trim();
    if (current) return;

    const sucursalUsuarioId = (
      session?.user as unknown as SessionUserSucursal | undefined
    )?.sucursal;

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

  // ── Cuando cambia tipoObra, gestionar el campo custom ────────────────────

  useEffect(() => {
    setTipoObraEsCustom(watchTipoObra === TIPO_OBRA_OTRO);
    if (watchTipoObra !== TIPO_OBRA_OTRO) {
      setValue("tipoObraCustom", "");
    }
  }, [watchTipoObra, setValue]);

  // ── Mutation ───────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: async (formData: FormInputs) => {
      let clienteId = formData.cliente;

      if (clienteMode === "crear") {
        if (!formData.newClient?.nombreCompleto || !formData.newClient?.telefono) {
          throw new Error(
            "Nombre y teléfono son obligatorios para un nuevo cliente."
          );
        }

        const clientResponse = await axios.post("/api/clientes", {
          nombreCompleto: formData.newClient.nombreCompleto,
          telefono: formData.newClient.telefono,
          email: formData.newClient.email,
          direccion: formData.newClient.direccion,
          prioridad: formData.newClient.prioridad || "Media",
        });

        clienteId = clientResponse.data.data._id;
      }

      if (!clienteId) throw new Error("Debe seleccionar o crear un cliente.");
      if (!formData.etapa) throw new Error("Debe seleccionar la columna inicial.");
      if (!formData.sucursalId?.trim()) throw new Error("Debe seleccionar una sucursal.");
      if (
        typeof formData.montoTotal !== "number" ||
        !Number.isFinite(formData.montoTotal)
      ) {
        throw new Error("Precio inválido.");
      }

      // Resolvemos el tipo de obra final
      const tipoObraFinal =
        formData.tipoObra === TIPO_OBRA_OTRO
          ? (formData.tipoObraCustom?.trim() || "")
          : (formData.tipoObra ?? "");

      if (tipoObraFinal) {
        const alreadyExists = tipoObraOptionsWithSaved.some(
          (option) =>
            option.value !== TIPO_OBRA_OTRO &&
            option.value.trim().toLowerCase() ===
              tipoObraFinal.trim().toLowerCase()
        );

        if (!alreadyExists) {
          await axios.post("/api/configuracion/tipoObra", {
            valor: tipoObraFinal,
          });
        }
      }

      return axios.post("/api/cotizaciones", {
        cliente: clienteId,
        montoTotal: formData.montoTotal,
        etapa: formData.etapa,
        sucursalId: formData.sucursalId,
        tipoAbertura: formData.tipoAbertura,
        comoNosConocio: formData.comoNosConocio,
        tipoObra: tipoObraFinal,
      });
    },

    onSuccess: () => {
      toast.success("Lead y cotización inicial creados con éxito.");
      queryClient.invalidateQueries({ queryKey: ["cotizacionesPipeline"] });
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      queryClient.invalidateQueries({ queryKey: ["configuracion", "tipoObra"] });
      resetForm();
      setOpen(false);
    },

    onError: (error: unknown) => {
      // ── Error de clave duplicada (Mongo E11000) ────────────────────────────
      if (error instanceof AxiosError) {
        const serverError: string =
          error.response?.data?.error ?? error.response?.data?.message ?? "";

        if (serverError.includes("E11000") || serverError.includes("duplicate key")) {
          toast.error(parseDuplicateKeyError(serverError), {
            duration: 6000,
          });
          return;
        }

        // Otros errores del servidor
        const msg =
          error.response?.data?.error ??
          error.response?.data?.message ??
          error.message ??
          "Error al crear el lead.";
        toast.error(msg);
        return;
      }

      // Error JS genérico
      const err = error as { message?: string };
      toast.error(err.message ?? "Error al crear el lead.");
    },
  });

  const resetForm = () => {
    reset({
      montoTotal: 0,
      sucursalId: "",
      tipoObra: "",
      tipoObraCustom: "",
      tipoAbertura: "",
      comoNosConocio: "",
      cliente: "",
      newClient: {
        nombreCompleto: "",
        telefono: "",
        email: "",
        direccion: "",
        prioridad: "Media",
      },
    });
    setTipoObraEsCustom(false);
    setClienteMode("seleccionar");
  };

  const onSubmit: SubmitHandler<FormInputs> = (data) => mutation.mutate(data);

  // ── Lógica de botón deshabilitado ─────────────────────────────────────────

  const isSubmitDisabled = useMemo(() => {
    if (mutation.isPending) return true;
    // Campos base obligatorios
    const values = getValues();
    if (!values.etapa) return true;
    if (!values.sucursalId) return true;
    if (clienteMode === "seleccionar" && !values.cliente) return true;
    if (clienteMode === "crear") {
      if (!values.newClient?.nombreCompleto?.trim()) return true;
      if (!values.newClient?.telefono?.trim()) return true;
    }
    if (tipoObraEsCustom && !watch("tipoObraCustom")?.trim()) return true;
    return false;
  }, [
    mutation.isPending,
    getValues,
    clienteMode,
    tipoObraEsCustom,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    watch("cliente"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    watch("etapa"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    watch("sucursalId"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    watch("newClient.nombreCompleto"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    watch("newClient.telefono"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    watch("tipoObraCustom"),
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>Crear Lead</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Captura Rápida de Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ── Cliente: seleccionar / crear ── */}
          <RadioGroup
            value={clienteMode}
            onValueChange={(value: "seleccionar" | "crear") =>
              setClienteMode(value)
            }
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="seleccionar" id="seleccionar" className="peer sr-only" />
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
              <Label>
                Cliente Existente <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="cliente"
                control={control}
                rules={{ required: "Seleccioná un cliente." }}
                render={({ field }) => (
                  <Combobox2
                    options={clienteOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Buscar cliente..."
                    searchText={isLoadingClientes ? "Cargando..." : "Buscar cliente..."}
                  />
                )}
              />
              {errors.cliente && (
                <p className="text-xs text-red-500">{errors.cliente.message}</p>
              )}
            </div>
          ) : (
            <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
              <h4 className="text-sm font-semibold">Datos del Nuevo Cliente</h4>

              <div className="space-y-2">
                <Label htmlFor="newClient.nombreCompleto">
                  Nombre y Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newClient.nombreCompleto"
                  {...register("newClient.nombreCompleto", {
                    required: clienteMode === "crear" ? "Campo obligatorio." : false,
                  })}
                  className={errors.newClient?.nombreCompleto ? "border-red-500" : ""}
                />
                {errors.newClient?.nombreCompleto && (
                  <p className="text-xs text-red-500">
                    {errors.newClient.nombreCompleto.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newClient.telefono">
                    Teléfono / WhatsApp <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newClient.telefono"
                    {...register("newClient.telefono", {
                      required: clienteMode === "crear" ? "Campo obligatorio." : false,
                    })}
                    className={errors.newClient?.telefono ? "border-red-500" : ""}
                  />
                  {errors.newClient?.telefono && (
                    <p className="text-xs text-red-500">
                      {errors.newClient.telefono.message}
                    </p>
                  )}
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

              <div className="space-y-2">
                <Label htmlFor="newClient.direccion">Zona / Dirección</Label>
                <Input
                  id="newClient.direccion"
                  placeholder="Ej: Palermo, Av. Santa Fe 1234"
                  {...register("newClient.direccion")}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Controller
                  name="newClient.prioridad"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={prioridadOptions}
                      value={field.value ?? "Media"}
                      onChange={field.onChange}
                      placeholder="Selecciona la prioridad..."
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* ── Precio + Etapa ── */}
          <div className="pt-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montoTotal">
                  Precio <span className="text-red-500">*</span>
                </Label>
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
                <Label>
                  Columna a colocar <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="etapa"
                  control={control}
                  rules={{ required: "Seleccioná una etapa." }}
                  render={({ field }) => (
                    <Combobox2
                      options={etapaOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccionar etapa..."
                      searchText={isLoadingEtapas ? "Cargando..." : "Buscar etapa..."}
                    />
                  )}
                />
                {errors.etapa && (
                  <p className="text-xs text-red-500">{errors.etapa.message}</p>
                )}
              </div>
            </div>

            {/* ── Sucursal ── */}
            <div className="space-y-2">
              <Label>
                Sucursal <span className="text-red-500">*</span>
              </Label>
              <div className={bloquearSucursal ? "pointer-events-none opacity-60" : ""}>
                <Controller
                  name="sucursalId"
                  control={control}
                  rules={{ required: "La sucursal es obligatoria." }}
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
              {errors.sucursalId && (
                <p className="text-xs text-red-500">{errors.sucursalId.message}</p>
              )}
            </div>

            {/* ── Tipo abertura + Cómo nos conoció ── */}
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

            {/* ── Tipo de obra + campo custom ── */}
            <div className="space-y-2">
              <Label>Tipo de obra</Label>
              <Controller
                name="tipoObra"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={tipoObraOptionsWithSaved}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Selecciona o escribÃ­ el tipo de obra..."
                    searchText="Buscar o escribir tipo de obra..."
                    emptyText="No se encontrÃ³. PresionÃ¡ Enter para guardarlo."
                  />
                )}
              />
            </div>

            {/* Campo libre cuando el usuario elige "Otro…" */}
            {tipoObraEsCustom && (
              <div className="space-y-2">
                <Label htmlFor="tipoObraCustom">
                  Especificá el tipo de obra{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tipoObraCustom"
                  placeholder="Ej: Galpón industrial, Ampliación, etc."
                  {...register("tipoObraCustom", {
                    required: tipoObraEsCustom ? "Especificá el tipo de obra." : false,
                  })}
                  className={errors.tipoObraCustom ? "border-red-500" : ""}
                />
                {errors.tipoObraCustom && (
                  <p className="text-xs text-red-500">
                    {errors.tipoObraCustom.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Submit ── */}
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full"
            title={isSubmitDisabled ? "Completá los campos obligatorios" : undefined}
          >
            {mutation.isPending ? "Creando Lead..." : "Crear Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
