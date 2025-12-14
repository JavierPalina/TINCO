// /components/proyectos/FormMedicion.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ChevronsUpDown, Check, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CloudinaryMultiUpload } from "@/components/ui/CloudinaryMultiUpload";
import { FirmaDigitalField } from "@/components/ui/FirmaDigitalField";
import { ScrollArea } from "../ui/scroll-area";
import { IProyecto } from "@/models/Proyecto";
import { UserSelect } from "@/components/ui/UserSelect";

type Props = {
  proyecto: IProyecto;
  onClose?: () => void;
  onSaved?: () => void;
};

// ------------ CONSTANTES DE FORM ------------ //

const TIPOS_ABERTURA = [
  "Ventana",
  "Puerta",
  "Corrediza",
  "Paño fijo",
  "Batiente",
];

const CONDICION_VANOS_OPTIONS = [
  "Nivelado",
  "Desnivelado",
  "Con revoque",
  "Sin revoque",
  "Con marco existente",
];

const ESTADO_OBRA_MEDICION = ["En construcción", "Terminada", "Refacción"];

const TIPOS_PERFIL_PREVISTO = [
  "Módena (Aluar)",
  "A30 New (Aluar)",
  "A40 (Aluar)",
  "Herrero reforzado",
  "Tecnoperfiles Prime (PVC)",
  "Tecnoperfiles Advance (PVC)",
  "Rehau Synego (PVC)",
  "Rehau Euro-Design 60 (PVC)",
  "Deceuninck Zendow (PVC)",
  "Alcemar Línea 45 / 60 (Aluminio)",
];

const TIPOS_VIDRIO = [
  "Simple",
  "DVH",
  "Laminado",
  "Esmerilado",
  "Reflectivo",
];

const ESTADOS_FINALES_MEDICION = [
  "Completada",
  "Parcial",
  "Requiere nueva visita",
];

const OPCIONES_ENVIAR_VERIFICACION = ["Sí", "No", "En revisión"] as const;

type EnviarAVerificacion = (typeof OPCIONES_ENVIAR_VERIFICACION)[number];

type MedidaTomada = {
  alto: string;
  ancho: string;
};

type FormState = {
  numeroOrdenMedicion: string;

  clienteObraEmpresa: string;
  direccionObra: string;

  asignadoA: string;
  fechaMedicion: string;
  tipoAberturaMedida: string;

  cantidadAberturasMedidas: string;
  medidasTomadas: MedidaTomada[];

  toleranciasRecomendadas: string;

  condicionVanos: string[];
  estadoObraMedicion: string;

  tipoPerfilPrevisto: string;
  color: string;
  tipoVidrioSolicitado: string;

  planosAdjuntos: string[];
  fotosMedicion: string[];

  observacionesMedicion: string;
  firmaValidacionTecnico: string;

  estadoFinalMedicion: string;
  enviarAVerificacion: EnviarAVerificacion | "";
};

// Tipo auxiliar para la data de medición que viene del backend
type MedicionData = {
  fechaMedicion?: string | Date;
  medidasTomadas?: { alto?: string | number; ancho?: string | number }[];
  cantidadAberturasMedidas?: number | string;
  numeroOrdenMedicion?: number | string;

  clienteObraEmpresa?: string;
  direccionObra?: string;

  asignadoA?: { _id?: string } | string;
  tipoAberturaMedida?: string;

  toleranciasRecomendadas?: string;

  condicionVanos?: string[];
  estadoObraMedicion?: string;

  tipoPerfilPrevisto?: string;
  color?: string;
  tipoVidrioSolicitado?: string;

  planosAdjuntos?: string[];
  fotosMedicion?: string[];

  observacionesMedicion?: string;
  firmaValidacionTecnico?: string;

  estadoFinalMedicion?: string;
  enviarAVerificacion?: EnviarAVerificacion;
};

export default function MedicionFormModal({
  proyecto,
  onClose,
  onSaved,
}: Props) {
  const md = (proyecto.medicion || {}) as MedicionData;

  // Cliente (sin usar any)
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

  // Dirección de visita técnica si existe
  let direccionVisita = "";
  const visitaTecnica = proyecto.visitaTecnica as unknown;
  if (
    visitaTecnica &&
    typeof visitaTecnica === "object" &&
    "direccion" in visitaTecnica &&
    typeof (visitaTecnica as { direccion?: unknown }).direccion === "string"
  ) {
    direccionVisita =
      (visitaTecnica as { direccion?: string }).direccion ?? "";
  }

  // Dirección: medición > visita técnica
  const direccionBase = md.direccionObra || direccionVisita || "";

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Colores “recordados” en el combo de color
  const [colorOptions, setColorOptions] = useState<string[]>(() => {
    const base: string[] = [];
    if (md.color && typeof md.color === "string") base.push(md.color);
    return Array.from(new Set(base));
  });
  const [colorSearch, setColorSearch] = useState("");
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);

  // Combos simples
  const [tipoPerfilOpen, setTipoPerfilOpen] = useState(false);
  const [tipoVidrioOpen, setTipoVidrioOpen] = useState(false);
  const [tipoAberturaOpen, setTipoAberturaOpen] = useState(false);
  const [estadoObraOpen, setEstadoObraOpen] = useState(false);
  const [estadoFinalOpen, setEstadoFinalOpen] = useState(false);
  const [enviarVerifOpen, setEnviarVerifOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => {
    // Fecha
    let fecha = "";
    if (md.fechaMedicion) {
      const d = new Date(md.fechaMedicion);
      if (!Number.isNaN(d.getTime())) {
        fecha = d.toISOString().slice(0, 10);
      }
    }

    // Cantidad & medidas
    let medidas: MedidaTomada[] = [];
    if (Array.isArray(md.medidasTomadas) && md.medidasTomadas.length) {
      medidas = md.medidasTomadas.map((m) => ({
        alto: m.alto !== undefined ? String(m.alto) : "",
        ancho: m.ancho !== undefined ? String(m.ancho) : "",
      }));
    } else {
      medidas = [{ alto: "", ancho: "" }];
    }

    const cantidad =
      md.cantidadAberturasMedidas !== undefined
        ? String(md.cantidadAberturasMedidas)
        : String(medidas.length);

    return {
      numeroOrdenMedicion:
        md.numeroOrdenMedicion !== undefined
          ? String(md.numeroOrdenMedicion)
          : proyecto.numeroOrden?.toString() || "",

      clienteObraEmpresa: md.clienteObraEmpresa || clienteNombre || "",

      direccionObra: direccionBase,

      asignadoA:
        (typeof md.asignadoA === "string"
          ? md.asignadoA
          : md.asignadoA?._id) || "",
      fechaMedicion: fecha,
      tipoAberturaMedida: md.tipoAberturaMedida || "",

      cantidadAberturasMedidas: cantidad,
      medidasTomadas: medidas,

      toleranciasRecomendadas: md.toleranciasRecomendadas || "",

      condicionVanos: md.condicionVanos || [],
      estadoObraMedicion: md.estadoObraMedicion || "",

      tipoPerfilPrevisto: md.tipoPerfilPrevisto || "",
      color: md.color || "",
      tipoVidrioSolicitado: md.tipoVidrioSolicitado || "",

      planosAdjuntos: md.planosAdjuntos || [],
      fotosMedicion: md.fotosMedicion || [],

      observacionesMedicion: md.observacionesMedicion || "",
      firmaValidacionTecnico: md.firmaValidacionTecnico || "",

      estadoFinalMedicion: md.estadoFinalMedicion || "",
      enviarAVerificacion: md.enviarAVerificacion || "",
    };
  });

  const updateField = (
    field: keyof FormState,
    value: FormState[keyof FormState],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCondicionVano = (value: string) => {
    setForm((prev) => {
      const existe = prev.condicionVanos.includes(value);
      return {
        ...prev,
        condicionVanos: existe
          ? prev.condicionVanos.filter((v) => v !== value)
          : [...prev.condicionVanos, value],
      };
    });
  };

  // ------------ MEDIDAS TOMADAS DINÁMICAS ------------ //

  const updateMedida = (
    index: number,
    field: keyof MedidaTomada,
    value: string,
  ) => {
    setForm((prev) => {
      const copy = [...prev.medidasTomadas];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, medidasTomadas: copy };
    });
  };

  const addMedida = () => {
    setForm((prev) => ({
      ...prev,
      medidasTomadas: [...prev.medidasTomadas, { alto: "", ancho: "" }],
      cantidadAberturasMedidas: (prev.medidasTomadas.length + 1).toString(),
    }));
  };

  const removeMedida = (index: number) => {
    setForm((prev) => {
      const copy = [...prev.medidasTomadas];
      copy.splice(index, 1);
      const nuevaCantidad = copy.length > 0 ? copy.length.toString() : "1";

      return {
        ...prev,
        medidasTomadas: copy.length > 0 ? copy : [{ alto: "", ancho: "" }],
        cantidadAberturasMedidas: nuevaCantidad,
      };
    });
  };

  const handleCantidadAberturasChange = (value: string) => {
    updateField("cantidadAberturasMedidas", value);

    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n <= 0) return;

    setForm((prev) => {
      let medidas = [...prev.medidasTomadas];
      if (medidas.length < n) {
        const diff = n - medidas.length;
        for (let i = 0; i < diff; i++) {
          medidas.push({ alto: "", ancho: "" });
        }
      } else if (medidas.length > n) {
        medidas = medidas.slice(0, n);
      }
      return { ...prev, medidasTomadas: medidas };
    });
  };

  // ------------ SUBMIT ------------ //

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Validación mínima de fotos (mínimo 3)
    if (form.fotosMedicion.length < 3) {
      toast.error("Cargá al menos 3 fotos de medición.");
      setIsSubmitting(false);
      return;
    }

    const medidasNormalizadas = (form.medidasTomadas || [])
      .map((m) => ({
        alto: m.alto.trim(),
        ancho: m.ancho.trim(),
      }))
      .filter((m) => Object.values(m).some((v) => v !== ""));

    // 💡 Armamos los datos de medición una sola vez
    const datosMedicion = {
      numeroOrdenMedicion:
        form.numeroOrdenMedicion || proyecto.numeroOrden || undefined,

      clienteObraEmpresa: form.clienteObraEmpresa || undefined,
      direccionObra: form.direccionObra || undefined,

      asignadoA: form.asignadoA || undefined,
      fechaMedicion: form.fechaMedicion
        ? new Date(form.fechaMedicion)
        : undefined,
      tipoAberturaMedida: form.tipoAberturaMedida || undefined,

      cantidadAberturasMedidas: form.cantidadAberturasMedidas || undefined,
      medidasTomadas:
        medidasNormalizadas.length ? medidasNormalizadas : undefined,

      toleranciasRecomendadas: form.toleranciasRecomendadas || undefined,

      condicionVanos:
        form.condicionVanos && form.condicionVanos.length
          ? form.condicionVanos
          : undefined,
      estadoObraMedicion: form.estadoObraMedicion || undefined,

      tipoPerfilPrevisto: form.tipoPerfilPrevisto || undefined,
      color: form.color || undefined,
      tipoVidrioSolicitado: form.tipoVidrioSolicitado || undefined,

      planosAdjuntos:
        form.planosAdjuntos && form.planosAdjuntos.length
          ? form.planosAdjuntos
          : undefined,
      fotosMedicion:
        form.fotosMedicion && form.fotosMedicion.length
          ? form.fotosMedicion
          : undefined,

      observacionesMedicion: form.observacionesMedicion || undefined,
      firmaValidacionTecnico: form.firmaValidacionTecnico || undefined,

      estadoFinalMedicion: form.estadoFinalMedicion || undefined,
      enviarAVerificacion: form.enviarAVerificacion || undefined,
    };

    // 👇 Acá definimos el payload según si se pasa o no a Verificación
    let payload: any;

    if (form.enviarAVerificacion === "Sí") {
      // ✅ Completar etapa de medición y forzar estado a Verificación
      payload = {
        etapaACompletar: "medicion",
        datosFormulario: datosMedicion,
        forzarEstado: "Verificación",
      };
    } else {
      // ✅ Solo guardar datos de medición sin avanzar de estado
      payload = {
        datosFormulario: {
          medicion: datosMedicion,
        },
      };
    }

    await axios.put(`/api/proyectos/${proyecto._id}`, payload);

    toast.success(
      form.enviarAVerificacion === "Sí"
        ? "Medición guardada y proyecto pasado a Verificación."
        : "Medición actualizada correctamente.",
    );

    onSaved?.();
    onClose?.();
  } catch (error: unknown) {
    console.error(error);

    if (axios.isAxiosError(error)) {
      const errorMessage =
        (error.response?.data as { error?: string } | undefined)?.error ||
        error.message;
      toast.error("Error al guardar la medición: " + errorMessage);
    } else {
      toast.error(
        "Error al guardar la medición: " +
          (error instanceof Error ? error.message : "Error desconocido"),
      );
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // ------------ LABELS DE COMBOS ------------ //

  const selectedTipoAberturaLabel =
    form.tipoAberturaMedida || "Seleccionar tipo de abertura";

  const selectedEstadoObraLabel =
    form.estadoObraMedicion || "Seleccionar estado de la obra al medir";

  const selectedTipoPerfilLabel =
    form.tipoPerfilPrevisto || "Seleccionar tipo de perfil previsto";

  const selectedTipoVidrioLabel =
    form.tipoVidrioSolicitado || "Seleccionar tipo de vidrio";

  const selectedEstadoFinalLabel =
    form.estadoFinalMedicion || "Seleccionar estado final";

  const selectedEnviarVerificacionLabel =
    form.enviarAVerificacion || "Seleccionar opción";

  const selectedColorLabel = form.color || "Escribir o seleccionar color";

  // ------------ COLOR: CREAR / BORRAR OPCIONES ------------ //

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

  return (
    <DialogContent className="sm:max-w-[900px] p-0">
      <ScrollArea className="max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle>Editar Medición – {proyecto.numeroOrden}</DialogTitle>
          <DialogDescription>
            Completá los datos de la medición, el estado de la obra y la
            documentación asociada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-8 py-4">
            {/* NÚMERO DE ORDEN DE MEDICIÓN */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="numero-medicion">
                N° de orden de medición
              </Label>
              <Input
                id="numero-medicion"
                value={form.numeroOrdenMedicion}
                onChange={(e) =>
                  updateField("numeroOrdenMedicion", e.target.value)
                }
                placeholder="Ej: coincide con N° de orden o un correlativo de medición"
              />
            </div>

            {/* CLIENTE / OBRA / EMPRESA + DIRECCIÓN */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Cliente / Obra / Empresa
              </h3>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cliente-obra">
                  Cliente / Obra / Empresa
                </Label>
                {/* Vista desde proyecto ya creado */}
                <Input
                  id="cliente-obra"
                  value={form.clienteObraEmpresa}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="direccion-obra">Dirección de obra</Label>
                <Input
                  id="direccion-obra"
                  value={form.direccionObra}
                  onChange={(e) =>
                    updateField("direccionObra", e.target.value)
                  }
                  placeholder="Dirección donde se realizó la medición"
                />
              </div>
            </div>

            {/* TÉCNICO / FECHA / TIPO ABERTURA / CANTIDAD */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Datos de medición</h3>

              {/* Técnico */}
              <div className="flex flex-col gap-2">
                <Label>Técnico</Label>
                <UserSelect
                  value={form.asignadoA}
                  onChange={(val) => updateField("asignadoA", val)}
                />
              </div>

              {/* Fecha */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="fecha-medicion">
                  Fecha de medición
                </Label>
                <Input
                  id="fecha-medicion"
                  type="date"
                  value={form.fechaMedicion}
                  onChange={(e) =>
                    updateField("fechaMedicion", e.target.value)
                  }
                />
              </div>

              {/* Tipo de abertura medida */}
              <div className="flex flex-col gap-2">
                <Label>Tipo de abertura medida</Label>
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
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo de abertura..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron opciones.
                        </CommandEmpty>
                        <CommandGroup>
                          {TIPOS_ABERTURA.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("tipoAberturaMedida", opt);
                                setTipoAberturaOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.tipoAberturaMedida === opt
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

              {/* Cantidad de aberturas medidas */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="cantidad-aberturas">
                  Cantidad de aberturas medidas
                </Label>
                <Input
                  id="cantidad-aberturas"
                  type="number"
                  min={1}
                  value={form.cantidadAberturasMedidas}
                  onChange={(e) =>
                    handleCantidadAberturasChange(e.target.value)
                  }
                  placeholder="Total de unidades medidas"
                />
              </div>
            </div>

            {/* MEDIDAS TOMADAS */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Medidas tomadas (por abertura)
              </h3>
              <p className="text-sm text-muted-foreground">
                Cada fila corresponde a una abertura medida. Ingresá Alto x
                Ancho en mm o cm.
              </p>

              <div className="flex flex-col gap-3">
                {form.medidasTomadas.map((m, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 flex flex-col gap-3 bg-card/40"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Abertura #{index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeMedida(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Alto</Label>
                        <Input
                          value={m.alto}
                          onChange={(e) =>
                            updateMedida(index, "alto", e.target.value)
                          }
                          placeholder="Ej: 1200 (mm)"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Ancho</Label>
                        <Input
                          value={m.ancho}
                          onChange={(e) =>
                            updateMedida(index, "ancho", e.target.value)
                          }
                          placeholder="Ej: 800 (mm)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={addMedida}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar abertura
              </Button>

              {/* Tolerancias / ajustes */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="tolerancias">
                  Tolerancias o ajustes recomendados
                </Label>
                <Textarea
                  id="tolerancias"
                  rows={3}
                  value={form.toleranciasRecomendadas}
                  onChange={(e) =>
                    updateField("toleranciasRecomendadas", e.target.value)
                  }
                  placeholder="Margen para fabricación o instalación"
                />
              </div>
            </div>

            {/* CONDICIÓN DE VANOS / ESTADO OBRA */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Condición de vanos y estado de la obra
              </h3>

              {/* Condición de vanos */}
              <div className="flex flex-col gap-2">
                <Label>Condición de los vanos</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDICION_VANOS_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={form.condicionVanos.includes(opt)}
                        onCheckedChange={() => toggleCondicionVano(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Estado de la obra al medir */}
              <div className="flex flex-col gap-2">
                <Label>Estado de la obra al medir</Label>
                <Popover
                  open={estadoObraOpen}
                  onOpenChange={setEstadoObraOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedEstadoObraLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar estado..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron estados.
                        </CommandEmpty>
                        <CommandGroup>
                          {ESTADO_OBRA_MEDICION.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("estadoObraMedicion", opt);
                                setEstadoObraOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.estadoObraMedicion === opt
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

            {/* PERFIL / COLOR / VIDRIO */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Configuración de carpintería y vidrio
              </h3>

              {/* Tipo de perfil previsto */}
              <div className="flex flex-col gap-2">
                <Label>Tipo de perfil previsto</Label>
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
                          No se encontraron perfiles.
                        </CommandEmpty>
                        <CommandGroup>
                          {TIPOS_PERFIL_PREVISTO.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("tipoPerfilPrevisto", opt);
                                setTipoPerfilOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.tipoPerfilPrevisto === opt
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

              {/* Color con memoria de opciones */}
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
                        <CommandEmpty>
                          No hay colores guardados.
                        </CommandEmpty>
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

              {/* Tipo de vidrio solicitado */}
              <div className="flex flex-col gap-2">
                <Label>Tipo de vidrio solicitado</Label>
                <Popover
                  open={tipoVidrioOpen}
                  onOpenChange={setTipoVidrioOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedTipoVidrioLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo de vidrio..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron tipos de vidrio.
                        </CommandEmpty>
                        <CommandGroup>
                          {TIPOS_VIDRIO.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("tipoVidrioSolicitado", opt);
                                setTipoVidrioOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.tipoVidrioSolicitado === opt
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

            {/* PLANOS / FOTOS / OBS / FIRMA */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">
                  Documentación gráfica
                </h3>

                {/* Referencia de plano o croquis */}
                <CloudinaryMultiUpload
                  label="Referencia del plano o croquis"
                  helper="Subí hasta 3 archivos (imágenes o PDFs) como referencia de plano o croquis."
                  value={form.planosAdjuntos}
                  onChange={(urls) => updateField("planosAdjuntos", urls)}
                  maxFiles={3}
                  folder="tinco/medicion/planos"
                />

                {/* Fotos de medición */}
                <CloudinaryMultiUpload
                  label="Fotos de medición"
                  helper="Subí mínimo 3 fotos de cada vano, detalle de marco y referencia de nivel."
                  value={form.fotosMedicion}
                  onChange={(urls) => updateField("fotosMedicion", urls)}
                  maxFiles={10}
                  folder="tinco/medicion/fotos"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">
                  Observaciones y firma
                </h3>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="obs-medicion">
                    Observaciones técnicas de medición
                  </Label>
                  <Textarea
                    id="obs-medicion"
                    rows={3}
                    value={form.observacionesMedicion}
                    onChange={(e) =>
                      updateField("observacionesMedicion", e.target.value)
                    }
                    placeholder="Inclinaciones, interferencias, detalles no visibles..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Firma de validación del técnico</Label>
                  <FirmaDigitalField
                    value={form.firmaValidacionTecnico}
                    onChange={(url) =>
                      updateField("firmaValidacionTecnico", url)
                    }
                  />
                </div>
              </div>
            </div>

            {/* ESTADO FINAL + ENVIAR A VERIFICACIÓN */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Cierre de medición</h3>

              {/* Estado final de la medición */}
              <div className="flex flex-col gap-2">
                <Label>Estado final de la medición</Label>
                <Popover
                  open={estadoFinalOpen}
                  onOpenChange={setEstadoFinalOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedEstadoFinalLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar estado..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron estados.
                        </CommandEmpty>
                        <CommandGroup>
                          {ESTADOS_FINALES_MEDICION.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("estadoFinalMedicion", opt);
                                setEstadoFinalOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.estadoFinalMedicion === opt
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

              {/* Enviar a verificación */}
              <div className="flex flex-col gap-2">
                <Label>Enviar a verificación</Label>
                <Popover
                  open={enviarVerifOpen}
                  onOpenChange={setEnviarVerifOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedEnviarVerificacionLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0">
                    <Command>
                      <CommandInput placeholder="Seleccionar opción..." />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron opciones.
                        </CommandEmpty>
                        <CommandGroup>
                          {OPCIONES_ENVIAR_VERIFICACION.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("enviarAVerificacion", opt);
                                setEnviarVerifOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.enviarAVerificacion === opt
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
                  Si seleccionás <strong>Sí</strong>, el proyecto pasará
                  automáticamente al estado <strong>Verificación</strong> al
                  guardar.
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
              {isSubmitting ? "Guardando..." : "Guardar medición"}
            </Button>
          </DialogFooter>
        </form>
      </ScrollArea>
    </DialogContent>
  );
}
