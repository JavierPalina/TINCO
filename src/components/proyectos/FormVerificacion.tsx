// /components/proyectos/VerificacionFormModal.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { IProyecto } from "@/models/Proyecto";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CloudinaryMultiUpload } from "@/components/ui/CloudinaryMultiUpload";
import { UserSelect } from "@/components/ui/UserSelect";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  proyecto: IProyecto;
  onClose?: () => void;
  onSaved?: () => void;
};

// Opciones fijas

const MEDIDAS_VERIFICADAS_OPTIONS = ["Sí", "No", "Observaciones"] as const;

const FUENTE_MEDIDAS_OPTIONS = [
  "Medición en obra propia",
  "Plano del cliente",
  "Plano del arquitecto / estudio",
  "Relevamiento de obra",
  "Medición del vendedor",
  "Medidas del constructor / contratista",
  "Croquis manual en oficina",
  "Plano digital (AutoCAD, PDF)",
  "No confirmadas / en revisión",
];

const PLANOS_REVISADOS_OPTIONS = [
  "Plano aprobado",
  "Plano aprobado con observaciones",
  "Plano con errores / requiere corrección",
  "Plano actualizado (nueva versión)",
  "Plano pendiente de aprobación",
  "Plano verificado en obra",
];

const MATERIALES_DISPONIBLES_OPTIONS = [
  "Sí",
  "No",
  "Faltan materiales",
  "Pendiente de ingreso",
  "En revisión",
];

const LISTA_MATERIALES_REVISADA_OPTIONS = ["Sí", "Pendiente", "No"];

const ACCESORIOS_COMPLETOS_OPTIONS = [
  "Sí",
  "No",
  "Faltan accesorios",
  "Pendiente de recepción",
  "En revisión",
];

const VIDRIOS_DISPONIBLES_OPTIONS = ["Sí", "Pendiente", "No"];

const ESTADO_COLOR_OPTIONS = [
  "Sí",
  "No",
  "En revisión",
  "Pendiente de recepción",
];

const TIPO_MATERIAL_OPTIONS = ["Aluminio", "PVC", "Mixto", "Otro"];

const PERFIL_ALUMINIO_OPTIONS = [
  "A30 New",
  "Módena",
  "Herrero",
  "A40",
  "A40 RPT",
  "HA62",
  "HA110",
  "NewGlass",
  "NewTek",
  "Ekonal",
  "Rotonda 640",
  "Rotonda 740",
  "Rotonda 1000",
  "Alcemar 45",
  "Alcemar 60",
  "Alcemar 80",
  "Otro (especificar)",
];

const PROVEEDOR_ALUMINIO_OPTIONS = [
  "Aluar",
  "Hydro / Technal",
  "Rotonda / Hydro Building Systems",
  "Extralum / Alcemar / Alumicentro",
  "Alcemar",
  "Otro (especificar)",
];

const PERFIL_PVC_OPTIONS = [
  "Tecnoperfiles Prime",
  "Tecnoperfiles Ecolife",
  "Tecnoperfiles Advance",
  "Tecnoperfiles Jumbo",
  "Rehau Synego",
  "Rehau Euro-Design 60",
  "Deceuninck Zendow",
  "Deceuninck Everest Max",
  "Kommerling EuroFutur",
  "Aluplast Ideal 4000",
  "Veka Softline",
  "Schüco Corona CT70",
  "Winsa Series",
  "Rehau Geneo",
  "Otro (especificar)",
];

const PROVEEDOR_PVC_OPTIONS = [
  "Tecnoperfiles",
  "Rehau",
  "Deceuninck",
  "Kommerling",
  "Aluplast",
  "Otra (especificar)",
];

const ESTADO_PERFILES_OPTIONS = [
  "Buen estado",
  "Golpeado",
  "Rayado",
  "Sucio",
  "Deformado",
  "Cortado incorrecto",
  "Faltante",
  "En revisión",
  "En reparación",
  "Rechazado",
];

const COMPATIBILIDAD_HERRAJES_OPTIONS = ["Sí", "No", "Revisión"];

const MEDIDAS_VIDRIOS_CONFIRMADAS_OPTIONS = ["Sí", "Pendiente", "No"];

const ESTADO_GENERAL_VERIFICACION_OPTIONS = [
  "Aprobado",
  "Con observaciones",
  "Rechazado",
];

const APROBADO_PARA_PRODUCCION_OPTIONS = ["Sí", "No"];

type FormState = {
  clienteObraEmpresa: string;
  direccionObra: string;

  medidasVerificadas: string;
  medidasVerificadasObservaciones: string;

  fuenteMedidas: string;
  planosRevisados: string;
  fechaRevisionPlano: string;

  materialesDisponiblesEstado: string;
  materialesFaltantesDetalle: string;
  materialesProveedorPendiente: string;
  listaMaterialesRevisada: string;

  accesoriosCompletosEstado: string;
  accesoriosFaltantesDetalle: string;

  vidriosDisponiblesEstado: string;

  color: string;
  estadoColor: string;

  tipoMaterial: string;
  tipoPerfilVerificado: string;
  proveedorPerfil: string;

  estadoPerfiles: string;
  compatibilidadHerrajes: string;
  medidasVidriosConfirmadas: string;

  archivosPlanosCroquis: string[];

  usuarioVerifico: string;
  fechaVerificacionCompleta: string;

  observacionesVerificacion: string;
  estadoGeneralVerificacion: string;
  aprobadoParaProduccion: string;
};

// Tipo auxiliar de la data de verificación que viene del backend
type VerificacionData = {
  clienteObraEmpresa?: string;
  direccionObra?: string;

  medidasVerificadas?: string;
  medidasVerificadasObservaciones?: string;

  fuenteMedidas?: string;
  planosRevisados?: string;
  fechaRevisionPlano?: string | Date;

  materialesDisponiblesEstado?: string;
  materialesFaltantesDetalle?: string;
  materialesProveedorPendiente?: string;
  listaMaterialesRevisada?: string;

  accesoriosCompletosEstado?: string;
  accesoriosFaltantesDetalle?: string;

  vidriosDisponiblesEstado?: string;

  color?: string;
  estadoColor?: string;

  tipoMaterial?: string;
  tipoPerfilVerificado?: string;
  proveedorPerfil?: string;

  estadoPerfiles?: string;
  compatibilidadHerrajes?: string;
  medidasVidriosConfirmadas?: string;

  archivosPlanosCroquis?: string[];

  usuarioVerifico?: { _id?: string } | string;
  fechaVerificacionCompleta?: string | Date;

  observacionesVerificacion?: string;
  estadoGeneralVerificacion?: string;
  aprobadoParaProduccion?: string;
};

export default function VerificacionFormModal({
  proyecto,
  onClose,
  onSaved,
}: Props) {
  const v = (proyecto.verificacion || {}) as VerificacionData;

  // visita técnica (solo nos interesa la dirección)
  let direccionVisita = "";
  const visita = proyecto.visitaTecnica as unknown;
  if (
    visita &&
    typeof visita === "object" &&
    "direccion" in visita &&
    typeof (visita as { direccion?: unknown }).direccion === "string"
  ) {
    direccionVisita = (visita as { direccion?: string }).direccion ?? "";
  }

  // cliente
  let clienteNombre = "Sin nombre de cliente";
  const cliente = proyecto.cliente as unknown;
  if (
    cliente &&
    typeof cliente === "object" &&
    "nombreCompleto" in cliente &&
    typeof (cliente as { nombreCompleto?: unknown }).nombreCompleto === "string"
  ) {
    clienteNombre =
      (cliente as { nombreCompleto?: string }).nombreCompleto ??
      "Sin nombre de cliente";
  }

  const direccionBase = v.direccionObra || direccionVisita || "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Color dynamic list
  const [colorOptions, setColorOptions] = useState<string[]>([
    "Blanco",
    "Negro",
    "Gris",
    "Negro texturado",
    "Bronce",
  ]);
  const [colorOpen, setColorOpen] = useState(false);
  const [colorSearch, setColorSearch] = useState("");

  const [form, setForm] = useState<FormState>(() => {
    const fechaRev =
      v.fechaRevisionPlano &&
      !Number.isNaN(new Date(v.fechaRevisionPlano).getTime())
        ? new Date(v.fechaRevisionPlano).toISOString().slice(0, 10)
        : "";

    const fechaVerifCompleta =
      v.fechaVerificacionCompleta &&
      !Number.isNaN(new Date(v.fechaVerificacionCompleta).getTime())
        ? new Date(v.fechaVerificacionCompleta).toISOString().slice(0, 10)
        : "";

    return {
      clienteObraEmpresa: v.clienteObraEmpresa || clienteNombre,
      direccionObra: direccionBase,

      medidasVerificadas: v.medidasVerificadas || "",
      medidasVerificadasObservaciones:
        v.medidasVerificadasObservaciones || "",

      fuenteMedidas: v.fuenteMedidas || "",
      planosRevisados: v.planosRevisados || "",
      fechaRevisionPlano: fechaRev,

      materialesDisponiblesEstado: v.materialesDisponiblesEstado || "",
      materialesFaltantesDetalle: v.materialesFaltantesDetalle || "",
      materialesProveedorPendiente: v.materialesProveedorPendiente || "",
      listaMaterialesRevisada: v.listaMaterialesRevisada || "",

      accesoriosCompletosEstado: v.accesoriosCompletosEstado || "",
      accesoriosFaltantesDetalle: v.accesoriosFaltantesDetalle || "",

      vidriosDisponiblesEstado: v.vidriosDisponiblesEstado || "",

      color: v.color || "",
      estadoColor: v.estadoColor || "",

      tipoMaterial: v.tipoMaterial || "",
      tipoPerfilVerificado: v.tipoPerfilVerificado || "",
      proveedorPerfil: v.proveedorPerfil || "",

      estadoPerfiles: v.estadoPerfiles || "",
      compatibilidadHerrajes: v.compatibilidadHerrajes || "",
      medidasVidriosConfirmadas: v.medidasVidriosConfirmadas || "",

      archivosPlanosCroquis: v.archivosPlanosCroquis || [],

      usuarioVerifico:
        typeof v.usuarioVerifico === "string"
          ? v.usuarioVerifico
          : v.usuarioVerifico?._id || "",
      fechaVerificacionCompleta: fechaVerifCompleta,

      observacionesVerificacion: v.observacionesVerificacion || "",
      estadoGeneralVerificacion: v.estadoGeneralVerificacion || "",
      aprobadoParaProduccion: v.aprobadoParaProduccion || "",
    };
  });

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateColor = () => {
    const nuevo = colorSearch.trim();
    if (!nuevo) return;
    if (!colorOptions.includes(nuevo)) {
      setColorOptions((prev) => [...prev, nuevo]);
    }
    updateField("color", nuevo);
    setColorSearch("");
    setColorOpen(false);
  };

  const colorLabel = form.color || "Seleccionar color";

  const perfilesOptionsByMaterial = () => {
    if (form.tipoMaterial === "Aluminio") return PERFIL_ALUMINIO_OPTIONS;
    if (form.tipoMaterial === "PVC") return PERFIL_PVC_OPTIONS;
    return []; // Mixto / Otro → campo texto
  };

  const proveedorOptionsByMaterial = () => {
    if (form.tipoMaterial === "Aluminio") return PROVEEDOR_ALUMINIO_OPTIONS;
    if (form.tipoMaterial === "PVC") return PROVEEDOR_PVC_OPTIONS;
    return [];
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        datosFormulario: {
          verificacion: {
            clienteObraEmpresa: form.clienteObraEmpresa || undefined,
            direccionObra: form.direccionObra || undefined,

            medidasVerificadas: form.medidasVerificadas || undefined,
            medidasVerificadasObservaciones:
              form.medidasVerificadas === "Observaciones"
                ? form.medidasVerificadasObservaciones || undefined
                : undefined,

            fuenteMedidas: form.fuenteMedidas || undefined,
            planosRevisados: form.planosRevisados || undefined,
            fechaRevisionPlano: form.fechaRevisionPlano
              ? new Date(form.fechaRevisionPlano)
              : undefined,

            materialesDisponiblesEstado:
              form.materialesDisponiblesEstado || undefined,
            materialesFaltantesDetalle:
              form.materialesDisponiblesEstado === "Faltan materiales"
                ? form.materialesFaltantesDetalle || undefined
                : undefined,
            materialesProveedorPendiente:
              form.materialesDisponiblesEstado === "Pendiente de ingreso"
                ? form.materialesProveedorPendiente || undefined
                : undefined,
            listaMaterialesRevisada:
              form.listaMaterialesRevisada || undefined,

            accesoriosCompletosEstado:
              form.accesoriosCompletosEstado || undefined,
            accesoriosFaltantesDetalle:
              form.accesoriosCompletosEstado === "Faltan accesorios"
                ? form.accesoriosFaltantesDetalle || undefined
                : undefined,

            vidriosDisponiblesEstado:
              form.vidriosDisponiblesEstado || undefined,

            color: form.color || undefined,
            estadoColor: form.estadoColor || undefined,

            tipoMaterial: form.tipoMaterial || undefined,
            tipoPerfilVerificado: form.tipoPerfilVerificado || undefined,
            proveedorPerfil: form.proveedorPerfil || undefined,

            estadoPerfiles: form.estadoPerfiles || undefined,
            compatibilidadHerrajes:
              form.compatibilidadHerrajes || undefined,
            medidasVidriosConfirmadas:
              form.medidasVidriosConfirmadas || undefined,

            archivosPlanosCroquis:
              form.archivosPlanosCroquis &&
              form.archivosPlanosCroquis.length
                ? form.archivosPlanosCroquis
                : undefined,

            usuarioVerifico: form.usuarioVerifico || undefined,
            fechaVerificacionCompleta: form.fechaVerificacionCompleta
              ? new Date(form.fechaVerificacionCompleta)
              : undefined,

            observacionesVerificacion:
              form.observacionesVerificacion || undefined,
            estadoGeneralVerificacion:
              form.estadoGeneralVerificacion || undefined,
            aprobadoParaProduccion:
              form.aprobadoParaProduccion || undefined,
          },
        },
      };

      await axios.put(`/api/proyectos/${proyecto._id}`, payload);

      toast.success("Verificación actualizada correctamente");
      onSaved?.();
      onClose?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: string } | undefined)?.error ??
          error.message;
        toast.error("Error al guardar la verificación: " + msg);
      } else {
        toast.error(
          "Error al guardar la verificación: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[900px] p-0">
      <ScrollArea className="max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle>
            Editar Verificación – {proyecto.numeroOrden}
          </DialogTitle>
          <DialogDescription>
            Completá los datos de verificación de medidas, materiales y
            perfiles antes de pasar a taller.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-8 py-4">
            {/* Cliente / Obra / Empresa */}
            <div className="flex flex-col gap-2">
              <Label>Cliente / Obra / Empresa</Label>
              <Input
                value={form.clienteObraEmpresa}
                onChange={(e) =>
                  updateField("clienteObraEmpresa", e.target.value)
                }
                placeholder="Nombre de cliente / obra / empresa"
              />
            </div>

            {/* Dirección */}
            <div className="flex flex-col gap-2">
              <Label>Dirección de la obra</Label>
              <Input
                value={form.direccionObra}
                onChange={(e) =>
                  updateField("direccionObra", e.target.value)
                }
                placeholder="Dirección en la que se verificó el caso"
              />
            </div>

            {/* Medidas y planos */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Medidas y planos</h3>

              <div className="flex flex-col gap-2">
                <Label>Medidas verificadas</Label>
                <div className="flex flex-wrap gap-2">
                  {MEDIDAS_VERIFICADAS_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.medidasVerificadas === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() => updateField("medidasVerificadas", opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              {form.medidasVerificadas === "Observaciones" && (
                <div className="flex flex-col gap-2">
                  <Label>Observaciones sobre las medidas</Label>
                  <Textarea
                    rows={3}
                    value={form.medidasVerificadasObservaciones}
                    onChange={(e) =>
                      updateField(
                        "medidasVerificadasObservaciones",
                        e.target.value,
                      )
                    }
                    placeholder="Describí las observaciones detectadas en las medidas..."
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Fuente de medidas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {form.fuenteMedidas || "Seleccionar fuente de medidas"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar fuente..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron opciones.
                        </CommandEmpty>
                        <CommandGroup>
                          {FUENTE_MEDIDAS_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => updateField("fuenteMedidas", opt)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.fuenteMedidas === opt
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {opt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Planos revisados</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {form.planosRevisados || "Seleccionar estado de planos"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar opción..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron opciones.
                        </CommandEmpty>
                        <CommandGroup>
                          {PLANOS_REVISADOS_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() =>
                                updateField("planosRevisados", opt)
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.planosRevisados === opt
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {opt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Fecha de revisión de plano</Label>
                <Input
                  type="date"
                  value={form.fechaRevisionPlano}
                  onChange={(e) =>
                    updateField("fechaRevisionPlano", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Materiales y accesorios */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Materiales, lista y accesorios
              </h3>

              <div className="flex flex-col gap-2">
                <Label>Materiales disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {MATERIALES_DISPONIBLES_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.materialesDisponiblesEstado === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("materialesDisponiblesEstado", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              {form.materialesDisponiblesEstado === "Faltan materiales" && (
                <div className="flex flex-col gap-2">
                  <Label>Detalle de materiales faltantes</Label>
                  <Textarea
                    rows={3}
                    value={form.materialesFaltantesDetalle}
                    onChange={(e) =>
                      updateField(
                        "materialesFaltantesDetalle",
                        e.target.value,
                      )
                    }
                    placeholder="Especificá qué materiales faltan..."
                  />
                </div>
              )}

              {form.materialesDisponiblesEstado === "Pendiente de ingreso" && (
                <div className="flex flex-col gap-2">
                  <Label>Proveedor al que se pidieron los materiales</Label>
                  <Input
                    value={form.materialesProveedorPendiente}
                    onChange={(e) =>
                      updateField(
                        "materialesProveedorPendiente",
                        e.target.value,
                      )
                    }
                    placeholder="Proveedor / distribuidor"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Lista de materiales revisada</Label>
                <div className="flex flex-wrap gap-2">
                  {LISTA_MATERIALES_REVISADA_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.listaMaterialesRevisada === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("listaMaterialesRevisada", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Accesorios completos</Label>
                <div className="flex flex-wrap gap-2">
                  {ACCESORIOS_COMPLETOS_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.accesoriosCompletosEstado === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("accesoriosCompletosEstado", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              {form.accesoriosCompletosEstado === "Faltan accesorios" && (
                <div className="flex flex-col gap-2">
                  <Label>Detalle de accesorios faltantes</Label>
                  <Textarea
                    rows={3}
                    value={form.accesoriosFaltantesDetalle}
                    onChange={(e) =>
                      updateField(
                        "accesoriosFaltantesDetalle",
                        e.target.value,
                      )
                    }
                    placeholder="Especificá qué accesorios faltan..."
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Vidrios disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {VIDRIOS_DISPONIBLES_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.vidriosDisponiblesEstado === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("vidriosDisponiblesEstado", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Color y material / perfiles */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Color, perfiles y material
              </h3>

              {/* Color */}
              <div className="flex flex-col gap-2">
                <Label>Color</Label>
                <Popover open={colorOpen} onOpenChange={setColorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {colorLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar o crear color..."
                        value={colorSearch}
                        onValueChange={setColorSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron colores.
                        </CommandEmpty>
                        <CommandGroup heading="Colores">
                          {colorOptions.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("color", opt);
                                setColorOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.color === opt
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="flex-1">{opt}</span>
                              <Trash2
                                className="h-3 w-3 text-destructive opacity-60 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setColorOptions((prev) =>
                                    prev.filter((o) => o !== opt),
                                  );
                                  if (form.color === opt) {
                                    updateField("color", "");
                                  }
                                }}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {colorSearch.trim() &&
                          !colorOptions.includes(colorSearch.trim()) && (
                            <CommandGroup heading="Acciones">
                              <CommandItem
                                value={colorSearch.trim()}
                                onSelect={handleCreateColor}
                              >
                                Crear &quot;
                                {colorSearch.trim()}
                                &quot;
                              </CommandItem>
                            </CommandGroup>
                          )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Estado de color</Label>
                <div className="flex flex-wrap gap-2">
                  {ESTADO_COLOR_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.estadoColor === opt ? "default" : "outline"
                      }
                      onClick={() => updateField("estadoColor", opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tipo de material */}
              <div className="flex flex-col gap-2">
                <Label>Tipo de material</Label>
                <div className="flex flex-wrap gap-2">
                  {TIPO_MATERIAL_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.tipoMaterial === opt ? "default" : "outline"
                      }
                      onClick={() => {
                        updateField("tipoMaterial", opt);
                      }}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tipo de perfil verificado */}
              {["Aluminio", "PVC"].includes(form.tipoMaterial) ? (
                <div className="flex flex-col gap-2">
                  <Label>Tipo de perfil verificado</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {form.tipoPerfilVerificado ||
                          "Seleccionar tipo de perfil"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar perfil..." />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron perfiles.
                          </CommandEmpty>
                          <CommandGroup>
                            {perfilesOptionsByMaterial().map((opt) => (
                              <CommandItem
                                key={opt}
                                value={opt}
                                onSelect={() =>
                                  updateField("tipoPerfilVerificado", opt)
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.tipoPerfilVerificado === opt
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {opt}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label>Tipo de perfil verificado</Label>
                  <Input
                    value={form.tipoPerfilVerificado}
                    onChange={(e) =>
                      updateField("tipoPerfilVerificado", e.target.value)
                    }
                    placeholder="Especificar tipo de perfil"
                  />
                </div>
              )}

              {/* Proveedor de perfil */}
              {["Aluminio", "PVC"].includes(form.tipoMaterial) ? (
                <div className="flex flex-col gap-2">
                  <Label>Proveedor de perfil</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {form.proveedorPerfil ||
                          "Seleccionar proveedor de perfil"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar proveedor..." />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron proveedores.
                          </CommandEmpty>
                          <CommandGroup>
                            {proveedorOptionsByMaterial().map((opt) => (
                              <CommandItem
                                key={opt}
                                value={opt}
                                onSelect={() =>
                                  updateField("proveedorPerfil", opt)
                                }
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.proveedorPerfil === opt
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {opt}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label>Proveedor de perfil</Label>
                  <Input
                    value={form.proveedorPerfil}
                    onChange={(e) =>
                      updateField("proveedorPerfil", e.target.value)
                    }
                    placeholder="Especificar proveedor de perfil"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label>Estado de los perfiles</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {form.estadoPerfiles ||
                        "Seleccionar estado de los perfiles"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar estado..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron estados.
                        </CommandEmpty>
                        <CommandGroup>
                          {ESTADO_PERFILES_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() =>
                                updateField("estadoPerfiles", opt)
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.estadoPerfiles === opt
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {opt}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Compatibilidad con herrajes</Label>
                <div className="flex flex-wrap gap-2">
                  {COMPATIBILIDAD_HERRAJES_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.compatibilidadHerrajes === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("compatibilidadHerrajes", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Medidas de vidrios confirmadas</Label>
                <div className="flex flex-wrap gap-2">
                  {MEDIDAS_VIDRIOS_CONFIRMADAS_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.medidasVidriosConfirmadas === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("medidasVidriosConfirmadas", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Archivos y auditoría */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">
                  Planos / croquis adjuntos
                </h3>

                <CloudinaryMultiUpload
                  label="Archivos de plano o croquis (hasta 5)"
                  helper="Subí planos generales y de detalle en PDF o imagen."
                  value={form.archivosPlanosCroquis}
                  onChange={(urls) =>
                    updateField("archivosPlanosCroquis", urls)
                  }
                  maxFiles={5}
                  folder="tinco/verificacion/planos"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">
                  Usuario y fechas de verificación
                </h3>

                <div className="flex flex-col gap-2">
                  <Label>Usuario que verificó</Label>
                  <UserSelect
                    value={form.usuarioVerifico}
                    onChange={(val) => updateField("usuarioVerifico", val)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Fecha de verificación completa</Label>
                  <Input
                    type="date"
                    value={form.fechaVerificacionCompleta}
                    onChange={(e) =>
                      updateField(
                        "fechaVerificacionCompleta",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Observaciones y estado general */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Resultado y aprobación para producción
              </h3>

              <div className="flex flex-col gap-2">
                <Label>Observaciones de verificación</Label>
                <Textarea
                  rows={3}
                  value={form.observacionesVerificacion}
                  onChange={(e) =>
                    updateField("observacionesVerificacion", e.target.value)
                  }
                  placeholder="Agregá cualquier comentario relevante de la verificación..."
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Estado general de la verificación</Label>
                <div className="flex flex-wrap gap-2">
                  {ESTADO_GENERAL_VERIFICACION_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.estadoGeneralVerificacion === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("estadoGeneralVerificacion", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Aprobado para producción</Label>
                <div className="flex flex-wrap gap-2">
                  {APROBADO_PARA_PRODUCCION_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.aprobadoParaProduccion === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("aprobadoParaProduccion", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Si se marca como &quot;Sí&quot;, el proyecto podrá pasar a
                  Taller para empezar la fabricación.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              onClick={() => !isSubmitting && onClose?.()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </ScrollArea>
    </DialogContent>
  );
}
