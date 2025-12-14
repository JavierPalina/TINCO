"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import { CloudinaryMultiUpload } from "@/components/ui/CloudinaryMultiUpload";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IProyecto } from "@/models/Proyecto";
import { UserSelect } from "@/components/ui/UserSelect";

// ----------------- CONSTANTES ----------------- //

const TIPOS_ABERTURA_TALLER = [
  "Ventana",
  "Puerta",
  "Corrediza",
  "Paño fijo",
  "Batiente",
];

const MATERIALES_PERFIL = ["Aluminio", "PVC", "Mixto", "Otro"] as const;
type MaterialPerfil = (typeof MATERIALES_PERFIL)[number];

const PERFILES_ALUMINIO = [
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

const PERFILES_PVC = [
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

const VIDRIO_OPTIONS = ["Simple", "DVH", "Laminado", "Otro"] as const;
type VidrioAColocar = (typeof VIDRIO_OPTIONS)[number];

const ACCESORIOS_COMPLETOS_OPTIONS = [
  "Sí",
  "No",
  "Faltante parcial",
] as const;
type AccesoriosCompletos = (typeof ACCESORIOS_COMPLETOS_OPTIONS)[number];

const MATERIAL_DISPONIBLE_OPTIONS = [
  "Completo",
  "Parcial",
  "Faltante crítico",
] as const;
type MaterialDisponible = (typeof MATERIAL_DISPONIBLE_OPTIONS)[number];

const MEDIDAS_VERIFICADAS_OPTIONS = [
  "Sí",
  "No",
  "Revisión pendiente",
] as const;
type MedidasVerificadas = (typeof MEDIDAS_VERIFICADAS_OPTIONS)[number];

const PLANOS_VERIFICADOS_OPTIONS = [
  "Sí",
  "No",
  "Modificación requerida",
] as const;
type PlanosVerificados = (typeof PLANOS_VERIFICADOS_OPTIONS)[number];

const ESTADO_TALLER_OPTIONS = [
  "En proceso",
  "Completo",
  "En espera",
  "Revisión",
  "Rechazado",
] as const;
type EstadoTaller = (typeof ESTADO_TALLER_OPTIONS)[number];

const PEDIDO_LISTO_OPTIONS = ["Sí", "No", "En revisión"] as const;
type PedidoListoEntrega = (typeof PEDIDO_LISTO_OPTIONS)[number];

const DERIVAR_A_OPTIONS = [
  "Depósito",
  "Logística",
  "Instalación en obra",
  "Retiro por cliente",
] as const;
type DerivarA = (typeof DERIVAR_A_OPTIONS)[number];

// ----------------- TIPOS ----------------- //

type TallerData = {
  numeroOrdenTaller?: number | string;
  clienteObraEmpresa?: string;

  fechaIngresoTaller?: string | Date;
  horaIngresoTaller?: string;

  asignadoA?: { _id?: string } | string;

  tipoAbertura?: string;
  materialPerfil?: MaterialPerfil;
  tipoPerfil?: string;
  tipoPerfilOtro?: string;

  color?: string;

  vidrioAColocar?: VidrioAColocar;
  accesoriosCompletos?: AccesoriosCompletos;
  materialDisponible?: MaterialDisponible;
  detalleMaterial?: string;

  medidasVerificadas?: MedidasVerificadas;
  planosVerificados?: PlanosVerificados;

  estadoTaller?: EstadoTaller;
  fechaEstimadaFinalizacion?: string | Date;

  informeTaller?: string;

  evidenciasTaller?: string[]; // fotos / videos

  controlCalidadRealizadoPor?: { _id?: string } | string;
  fechaControlCalidad?: string | Date;

  pedidoListoEntrega?: PedidoListoEntrega;
  derivarA?: DerivarA;
};

type FormState = {
  numeroOrdenTaller: string;
  clienteObraEmpresa: string;

  fechaIngresoTaller: string;
  horaIngresoTaller: string;

  asignadoA: string;

  tipoAbertura: string;
  materialPerfil: MaterialPerfil | "";
  tipoPerfil: string;
  tipoPerfilOtro: string;

  color: string;

  vidrioAColocar: VidrioAColocar | "";
  accesoriosCompletos: AccesoriosCompletos | "";
  materialDisponible: MaterialDisponible | "";
  detalleMaterial: string;

  medidasVerificadas: MedidasVerificadas | "";
  planosVerificados: PlanosVerificados | "";

  estadoTaller: EstadoTaller | "";
  fechaEstimadaFinalizacion: string;

  informeTaller: string;

  evidenciasTaller: string[];

  controlCalidadRealizadoPor: string;
  fechaControlCalidad: string;

  pedidoListoEntrega: PedidoListoEntrega | "";
  derivarA: DerivarA | "";
};

type Props = {
  proyecto: IProyecto;
  onClose?: () => void;
  onSaved?: () => void;
};

export default function TallerFormModal({ proyecto, onClose, onSaved }: Props) {
  const td = (proyecto.taller || {}) as TallerData;

  // Cliente (reutilizamos lógica de Medición)
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Colores guardados
  const [colorOptions, setColorOptions] = useState<string[]>(() => {
    const base: string[] = [];
    if (td.color && typeof td.color === "string") base.push(td.color);
    return Array.from(new Set(base));
  });
  const [colorSearch, setColorSearch] = useState("");
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  // Popovers de selects
  const [tipoAberturaOpen, setTipoAberturaOpen] = useState(false);
  const [materialPerfilOpen, setMaterialPerfilOpen] = useState(false);
  const [tipoPerfilOpen, setTipoPerfilOpen] = useState(false);
  const [vidrioOpen, setVidrioOpen] = useState(false);
  const [accesoriosOpen, setAccesoriosOpen] = useState(false);
  const [materialDispOpen, setMaterialDispOpen] = useState(false);
  const [medidasVerifOpen, setMedidasVerifOpen] = useState(false);
  const [planosVerifOpen, setPlanosVerifOpen] = useState(false);
  const [estadoTallerOpen, setEstadoTallerOpen] = useState(false);
  const [pedidoListoOpen, setPedidoListoOpen] = useState(false);
  const [derivarAOpen, setDerivarAOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => {
    const fechaIngreso =
      td.fechaIngresoTaller &&
      !Number.isNaN(new Date(td.fechaIngresoTaller).getTime())
        ? new Date(td.fechaIngresoTaller).toISOString().slice(0, 10)
        : "";

    const fechaEstimada =
      td.fechaEstimadaFinalizacion &&
      !Number.isNaN(new Date(td.fechaEstimadaFinalizacion).getTime())
        ? new Date(td.fechaEstimadaFinalizacion).toISOString().slice(0, 10)
        : "";

    const fechaControl =
      td.fechaControlCalidad &&
      !Number.isNaN(new Date(td.fechaControlCalidad).getTime())
        ? new Date(td.fechaControlCalidad).toISOString().slice(0, 10)
        : "";

    return {
      numeroOrdenTaller:
        td.numeroOrdenTaller !== undefined
          ? String(td.numeroOrdenTaller)
          : proyecto.numeroOrden?.toString() || "",

      clienteObraEmpresa: td.clienteObraEmpresa || clienteNombre || "",

      fechaIngresoTaller: fechaIngreso,
      horaIngresoTaller: td.horaIngresoTaller || "",

      asignadoA:
        (typeof td.asignadoA === "string"
          ? td.asignadoA
          : td.asignadoA?._id) || "",

      tipoAbertura: td.tipoAbertura || "",
      materialPerfil: td.materialPerfil || "",
      tipoPerfil: td.tipoPerfil || "",
      tipoPerfilOtro: td.tipoPerfilOtro || "",

      color: td.color || "",

      vidrioAColocar: td.vidrioAColocar || "",
      accesoriosCompletos: td.accesoriosCompletos || "",
      materialDisponible: td.materialDisponible || "",
      detalleMaterial: td.detalleMaterial || "",

      medidasVerificadas: td.medidasVerificadas || "",
      planosVerificados: td.planosVerificados || "",

      estadoTaller: td.estadoTaller || "",
      fechaEstimadaFinalizacion: fechaEstimada,

      informeTaller: td.informeTaller || "",

      evidenciasTaller: td.evidenciasTaller || [],

      controlCalidadRealizadoPor:
        (typeof td.controlCalidadRealizadoPor === "string"
          ? td.controlCalidadRealizadoPor
          : td.controlCalidadRealizadoPor?._id) || "",
      fechaControlCalidad: fechaControl,

      pedidoListoEntrega: td.pedidoListoEntrega || "",
      derivarA: td.derivarA || "",
    };
  });

  const updateField = (
    field: keyof FormState,
    value: FormState[keyof FormState],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ------------ COLOR: CREAR / BORRAR OPCIONES ------------ //

  const selectedColorLabel = form.color || "Escribir o seleccionar color";

  const handleCreateColor = () => {
    const nuevo = colorSearch.trim();
    if (!nuevo) return;
    setColorOptions((prev) => Array.from(new Set([...prev, nuevo])));
    updateField("color", nuevo);
    setColorSearch("");
    setColorPopoverOpen(false);
  };

  const handleSelectColor = (value: string) => {
    updateField("color", value);
    setColorPopoverOpen(false);
  };

  // ------------ LABELS DE SELECTS ------------ //

  const selectedTipoAberturaLabel =
    form.tipoAbertura || "Seleccionar tipo de abertura";

  const selectedMaterialPerfilLabel =
    form.materialPerfil || "Seleccionar material de perfil";

  const selectedTipoPerfilLabel =
    form.tipoPerfil || "Seleccionar tipo de perfil";

  const selectedVidrioLabel =
    form.vidrioAColocar || "Seleccionar tipo de vidrio";

  const selectedAccesoriosLabel =
    form.accesoriosCompletos || "Seleccionar opción";

  const selectedMaterialDispLabel =
    form.materialDisponible || "Seleccionar situación de material";

  const selectedMedidasVerifLabel =
    form.medidasVerificadas || "Seleccionar opción";

  const selectedPlanosVerifLabel =
    form.planosVerificados || "Seleccionar opción";

  const selectedEstadoTallerLabel =
    form.estadoTaller || "Seleccionar estado de taller";

  const selectedPedidoListoLabel =
    form.pedidoListoEntrega || "Seleccionar opción";

  const selectedDerivarALabel =
    form.derivarA || "Seleccionar destino de derivación";

  const isMaterialMixtoOuOtro =
    form.materialPerfil === "Mixto" || form.materialPerfil === "Otro";

  const showTipoPerfilSelect =
    form.materialPerfil === "Aluminio" || form.materialPerfil === "PVC";

  const showTipoPerfilOtroInput =
    isMaterialMixtoOuOtro ||
    form.tipoPerfil === "Otro (especificar)" ||
    form.materialPerfil === "Otro";

  // ------------ SUBMIT ------------ //

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Regla: si Pedido listo = "Sí" pero no eligió destino
      if (form.pedidoListoEntrega === "Sí" && !form.derivarA) {
        toast.error(
          "Seleccioná a dónde querés derivar el pedido (Depósito, Logística, etc.)",
        );
        setIsSubmitting(false);
        return;
      }

      // Armamos payload normalizado
      const payload = {
        datosFormulario: {
          taller: {
            numeroOrdenTaller:
              form.numeroOrdenTaller || proyecto.numeroOrden || undefined,

            clienteObraEmpresa: form.clienteObraEmpresa || undefined,

            fechaIngresoTaller: form.fechaIngresoTaller
              ? new Date(form.fechaIngresoTaller)
              : undefined,
            horaIngresoTaller: form.horaIngresoTaller || undefined,

            asignadoA: form.asignadoA || undefined,

            tipoAbertura: form.tipoAbertura || undefined,
            materialPerfil: form.materialPerfil || undefined,

            tipoPerfil: form.tipoPerfil || undefined,
            tipoPerfilOtro: form.tipoPerfilOtro || undefined,

            color: form.color || undefined,

            vidrioAColocar: form.vidrioAColocar || undefined,
            accesoriosCompletos: form.accesoriosCompletos || undefined,
            materialDisponible: form.materialDisponible || undefined,
            detalleMaterial: form.detalleMaterial || undefined,

            medidasVerificadas: form.medidasVerificadas || undefined,
            planosVerificados: form.planosVerificados || undefined,

            estadoTaller: form.estadoTaller || undefined,
            fechaEstimadaFinalizacion: form.fechaEstimadaFinalizacion
              ? new Date(form.fechaEstimadaFinalizacion)
              : undefined,

            informeTaller: form.informeTaller || undefined,

            evidenciasTaller:
              form.evidenciasTaller && form.evidenciasTaller.length
                ? form.evidenciasTaller
                : undefined,

            controlCalidadRealizadoPor:
              form.controlCalidadRealizadoPor || undefined,
            fechaControlCalidad: form.fechaControlCalidad
              ? new Date(form.fechaControlCalidad)
              : undefined,

            pedidoListoEntrega: form.pedidoListoEntrega || undefined,
            derivarA: form.derivarA || undefined,
          },
        },
      } as {
        datosFormulario: { taller: Record<string, unknown> };
        estadoActual?: string;
      };

      // 🔁 Regla de flujo de sector:
      // Si el pedido está listo para entrega y hay destino seleccionado,
      // actualizamos estadoActual al destino elegido
      if (form.pedidoListoEntrega === "Sí" && form.derivarA) {
        payload.estadoActual = form.derivarA;
      }

      await axios.put(`/api/proyectos/${proyecto._id}`, payload);

      toast.success(
        form.pedidoListoEntrega === "Sí" && form.derivarA
          ? `Taller guardado y derivado a ${form.derivarA}.`
          : "Datos de Taller guardados correctamente.",
      );

      onSaved?.();
      onClose?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const errorMessage =
          (error.response?.data as { error?: string } | undefined)?.error ||
          error.message;
        toast.error("Error al guardar Taller: " + errorMessage);
      } else {
        toast.error(
          "Error al guardar Taller: " +
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
            Taller – Orden {proyecto.numeroOrden ?? form.numeroOrdenTaller}
          </DialogTitle>
          <DialogDescription>
            Registrá el flujo de trabajo realizado en el taller, materiales,
            verificación y control de calidad.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-8 py-4">
            {/* N° ORDEN / CLIENTE */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Identificación de pedido
              </h3>

              <div className="flex flex-col gap-2">
                <Label htmlFor="numero-taller">N° de orden de taller</Label>
                <Input
                  id="numero-taller"
                  value={form.numeroOrdenTaller}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Se completa automáticamente desde la orden.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Cliente / Obra / Empresa</Label>
                <Input value={form.clienteObraEmpresa} disabled />
                <p className="text-xs text-muted-foreground">
                  Se toma del cliente asociado al proyecto.
                </p>
              </div>
            </div>

            {/* INGRESO AL TALLER */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Ingreso de pedido al taller
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fecha-ingreso">
                    Fecha de ingreso al taller
                  </Label>
                  <Input
                    id="fecha-ingreso"
                    type="date"
                    value={form.fechaIngresoTaller}
                    onChange={(e) =>
                      updateField("fechaIngresoTaller", e.target.value)
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="hora-ingreso">
                    Horario de ingreso al taller
                  </Label>
                  <Input
                    id="hora-ingreso"
                    type="time"
                    value={form.horaIngresoTaller}
                    onChange={(e) =>
                      updateField("horaIngresoTaller", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Técnico de taller</Label>
                <UserSelect
                  value={form.asignadoA}
                  onChange={(val) => updateField("asignadoA", val)}
                />
              </div>
            </div>

            {/* CONFIGURACIÓN DE ABERTURA */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Configuración de la abertura
              </h3>

              {/* Tipo de abertura */}
              <div className="flex flex-col gap-2">
                <Label>Tipo de abertura</Label>
                <Popover
                  open={tipoAberturaOpen}
                  onOpenChange={setTipoAberturaOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedTipoAberturaLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo de abertura..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron tipos de abertura.
                        </CommandEmpty>
                        <CommandGroup>
                          {TIPOS_ABERTURA_TALLER.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("tipoAbertura", opt);
                                setTipoAberturaOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.tipoAbertura === opt
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

              {/* Material de perfil */}
              <div className="flex flex-col gap-2">
                <Label>Material de perfil</Label>
                <Popover
                  open={materialPerfilOpen}
                  onOpenChange={setMaterialPerfilOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedMaterialPerfilLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar material..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron materiales.</CommandEmpty>
                        <CommandGroup>
                          {MATERIALES_PERFIL.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("materialPerfil", opt);
                                // reset de tipoPerfil cuando cambia material
                                updateField("tipoPerfil", "");
                                updateField("tipoPerfilOtro", "");
                                setMaterialPerfilOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.materialPerfil === opt
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

              {/* Tipo de perfil (según material) */}
              {showTipoPerfilSelect && (
                <div className="flex flex-col gap-2">
                  <Label>Tipo de perfil</Label>
                  <Popover
                    open={tipoPerfilOpen}
                    onOpenChange={setTipoPerfilOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedTipoPerfilLabel}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar perfil..." />
                        <CommandList>
                          <CommandEmpty>
                            No se encontraron tipos de perfil.
                          </CommandEmpty>
                          <CommandGroup>
                            {(form.materialPerfil === "Aluminio"
                              ? PERFILES_ALUMINIO
                              : PERFILES_PVC
                            ).map((opt) => (
                              <CommandItem
                                key={opt}
                                value={opt}
                                onSelect={() => {
                                  updateField("tipoPerfil", opt);
                                  if (opt !== "Otro (especificar)") {
                                    updateField("tipoPerfilOtro", "");
                                  }
                                  setTipoPerfilOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.tipoPerfil === opt
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
              )}

              {showTipoPerfilOtroInput && (
                <div className="flex flex-col gap-2">
                  <Label>Otro tipo de perfil (especificar)</Label>
                  <Input
                    value={form.tipoPerfilOtro}
                    onChange={(e) =>
                      updateField("tipoPerfilOtro", e.target.value)
                    }
                    placeholder="Especificar descripción del perfil"
                  />
                  <p className="text-xs text-muted-foreground">
                    Este campo se usa cuando el perfil no está en la lista o
                    cuando el material es Mixto/Otro.
                  </p>
                </div>
              )}

              {/* Color con memoria */}
              <div className="flex flex-col gap-2">
                <Label>Color</Label>
                <Popover
                  open={colorPopoverOpen}
                  onOpenChange={setColorPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedColorLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Escribir color o buscar..."
                        value={colorSearch}
                        onValueChange={setColorSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No hay colores guardados.</CommandEmpty>
                        <CommandGroup heading="Colores guardados">
                          {colorOptions.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => handleSelectColor(opt)}
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
                                    prev.filter((c) => c !== opt),
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
                                Crear &quot;{colorSearch.trim()}&quot;
                              </CommandItem>
                            </CommandGroup>
                          )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Vidrio a colocar */}
              <div className="flex flex-col gap-2">
                <Label>Vidrio a colocar</Label>
                <Popover open={vidrioOpen} onOpenChange={setVidrioOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedVidrioLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo de vidrio..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron tipos de vidrio.
                        </CommandEmpty>
                        <CommandGroup>
                          {VIDRIO_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("vidrioAColocar", opt);
                                setVidrioOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.vidrioAColocar === opt
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
            </div>

            {/* MATERIALES / VERIFICACIONES */}
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-semibold">
                Materiales y verificaciones
              </h3>

              {/* Accesorios completos */}
              <div className="flex flex-col gap-2">
                <Label>Accesorios completos</Label>
                <Popover
                  open={accesoriosOpen}
                  onOpenChange={setAccesoriosOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedAccesoriosLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar opción..." />
                      <CommandList>
                        <CommandEmpty>Sin opciones.</CommandEmpty>
                        <CommandGroup>
                          {ACCESORIOS_COMPLETOS_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("accesoriosCompletos", opt);
                                setAccesoriosOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.accesoriosCompletos === opt
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

              {/* Material disponible */}
              <div className="flex flex-col gap-2">
                <Label>Material disponible</Label>
                <Popover
                  open={materialDispOpen}
                  onOpenChange={setMaterialDispOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedMaterialDispLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar situación..." />
                      <CommandList>
                        <CommandEmpty>Sin opciones.</CommandEmpty>
                        <CommandGroup>
                          {MATERIAL_DISPONIBLE_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("materialDisponible", opt);
                                setMaterialDispOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.materialDisponible === opt
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

                <Textarea
                  rows={2}
                  value={form.detalleMaterial}
                  onChange={(e) =>
                    updateField("detalleMaterial", e.target.value)
                  }
                  placeholder="Detalle de faltantes o material crítico..."
                />
              </div>

              {/* Medidas verificadas */}
              <div className="flex flex-col gap-2">
                <Label>Medidas verificadas</Label>
                <Popover
                  open={medidasVerifOpen}
                  onOpenChange={setMedidasVerifOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedMedidasVerifLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar opción..." />
                      <CommandList>
                        <CommandEmpty>Sin opciones.</CommandEmpty>
                        <CommandGroup>
                          {MEDIDAS_VERIFICADAS_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("medidasVerificadas", opt);
                                setMedidasVerifOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.medidasVerificadas === opt
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

              {/* Planos verificados */}
              <div className="flex flex-col gap-2">
                <Label>Planos verificados</Label>
                <Popover
                  open={planosVerifOpen}
                  onOpenChange={setPlanosVerifOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedPlanosVerifLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar opción..." />
                      <CommandList>
                        <CommandEmpty>Sin opciones.</CommandEmpty>
                        <CommandGroup>
                          {PLANOS_VERIFICADOS_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("planosVerificados", opt);
                                setPlanosVerifOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.planosVerificados === opt
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
            </div>

            {/* ESTADO DE TALLER / FECHA ESTIMADA */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Estado de Taller</h3>

              <div className="flex flex-col gap-2">
                <Label>Estado de Taller</Label>
                <Popover
                  open={estadoTallerOpen}
                  onOpenChange={setEstadoTallerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedEstadoTallerLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar estado..." />
                      <CommandList>
                        <CommandEmpty>Sin opciones.</CommandEmpty>
                        <CommandGroup>
                          {ESTADO_TALLER_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("estadoTaller", opt);
                                setEstadoTallerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.estadoTaller === opt
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
                <Label htmlFor="fecha-estimada-fin">
                  Fecha estimada de finalización
                </Label>
                <Input
                  id="fecha-estimada-fin"
                  type="date"
                  value={form.fechaEstimadaFinalizacion}
                  onChange={(e) =>
                    updateField("fechaEstimadaFinalizacion", e.target.value)
                  }
                />
              </div>
            </div>

            {/* INFORME + EVIDENCIAS */}
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-semibold">
                Informe y evidencias de armado
              </h3>

              <div className="flex flex-col gap-2">
                <Label htmlFor="informe-taller">Informe de Taller</Label>
                <Textarea
                  id="informe-taller"
                  rows={4}
                  value={form.informeTaller}
                  onChange={(e) =>
                    updateField("informeTaller", e.target.value)
                  }
                  placeholder="Detalle del trabajo realizado en taller, observaciones, problemas detectados, etc."
                />
              </div>

              <CloudinaryMultiUpload
                label="Evidencias de armado"
                helper="Subí 3 a 5 fotos y/o videos de armado, detalles y control de calidad."
                value={form.evidenciasTaller}
                onChange={(urls) => updateField("evidenciasTaller", urls)}
                maxFiles={10}
                folder="tinco/taller/evidencias"
              />
            </div>

            {/* CONTROL DE CALIDAD */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Control de calidad en Taller
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Control de calidad realizado por</Label>
                  <UserSelect
                    value={form.controlCalidadRealizadoPor}
                    onChange={(val) =>
                      updateField("controlCalidadRealizadoPor", val)
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="fecha-cc">
                    Fecha de control de calidad
                  </Label>
                  <Input
                    id="fecha-cc"
                    type="date"
                    value={form.fechaControlCalidad}
                    onChange={(e) =>
                      updateField("fechaControlCalidad", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* PEDIDO LISTO / DERIVACIÓN */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Pedido listo para entrega
              </h3>

              <div className="flex flex-col gap-2">
                <Label>Pedido listo para entrega</Label>
                <Popover
                  open={pedidoListoOpen}
                  onOpenChange={setPedidoListoOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedPedidoListoLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar opción..." />
                      <CommandList>
                        <CommandEmpty>Sin opciones.</CommandEmpty>
                        <CommandGroup>
                          {PEDIDO_LISTO_OPTIONS.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("pedidoListoEntrega", opt);
                                if (opt !== "Sí") {
                                  updateField("derivarA", "");
                                }
                                setPedidoListoOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.pedidoListoEntrega === opt
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
                <p className="text-xs text-muted-foreground">
                  Al seleccionar <strong>Sí</strong>, el pedido pasará a otro
                  sector (Depósito, Logística, Instalación en obra o Retiro por
                  cliente).
                </p>
              </div>

              {form.pedidoListoEntrega === "Sí" && (
                <div className="flex flex-col gap-2">
                  <Label>Derivar pedido a</Label>
                  <Popover open={derivarAOpen} onOpenChange={setDerivarAOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedDerivarALabel}
                        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0">
                      <Command>
                        <CommandInput placeholder="Seleccionar destino..." />
                        <CommandList>
                          <CommandEmpty>Sin opciones.</CommandEmpty>
                          <CommandGroup>
                            {DERIVAR_A_OPTIONS.map((opt) => (
                              <CommandItem
                                key={opt}
                                value={opt}
                                onSelect={() => {
                                  updateField("derivarA", opt);
                                  setDerivarAOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.derivarA === opt
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
                  <p className="text-xs text-muted-foreground">
                    Esta selección actualiza el <strong>estadoActual</strong> de
                    la orden al sector elegido.
                  </p>
                </div>
              )}
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
              {isSubmitting ? "Guardando..." : "Guardar Taller"}
            </Button>
          </DialogFooter>
        </form>
      </ScrollArea>
    </DialogContent>
  );
}
