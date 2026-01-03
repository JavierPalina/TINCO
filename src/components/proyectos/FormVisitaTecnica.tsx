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
import { ProyectoDTO } from "@/types/proyecto";

type Props = {
  proyecto: ProyectoDTO;
  onClose?: () => void;
  onSaved?: () => void;
};

const ESTADO_OBRA_BASE = [
  "En construcción (sin revoque)",
  "Con revoque grueso terminado",
  "Con revoque fino terminado",
  "En etapa de pintura",
  "Con pisos colocados",
  "Lista para medición",
  "Lista para instalación",
  "En refacción / remodelación",
  "Obra detenida / sin actividad",
  "Terminada / entregada",
];

const CONDICION_VANOS_OPTIONS = [
  "Nivelado",
  "Desnivelado",
  "Con revoque",
  "Sin revoque",
  "Con marco existente",
];

const TIPOS_ABERTURA = [
  "Ventana",
  "Puerta",
  "Paño fijo",
  "Corrediza",
  "Batiente",
];

const ESTADOS_TAREA_VISITA = ["Aprobado", "Pendiente", "Rechazado"];

const RECOMENDACION_TECNICA_OPTIONS = [
  "Aprobado",
  "Revisión",
  "Requiere ajuste",
  "Postergar instalación",
];

type MedidaTomada = {
  alto: string;
  ancho: string;
  profundidad: string;
  largo: string;
  cantidad: string;
};

type FormState = {
  clienteObraEmpresa: string;

  asignadoA: string;
  fechaVisita: string;
  horaVisita: string;
  tipoVisita: string;

  direccion: string;
  entrecalles: string;
  otraInfoDireccion: string;

  estadoObra: string;
  condicionVanos: string[];
  medidasTomadas: MedidaTomada[];
  tipoAberturaMedida: string;

  materialSolicitado: string;
  color: string;
  vidriosConfirmados: string;

  planosAdjuntosText: string;
  fotosObraText: string;

  observacionesTecnicas: string;
  recomendacionTecnica: string;
  estadoTareaVisita: string;

  planosAdjuntos: string[];
  fotosObra: string[];
  firmaVerificacion: string;
};

// Tipo auxiliar para la data de visita técnica que viene del backend
type VisitaTecnicaData = {
  asignadoA?: string | { _id?: string };
  fechaVisita?: string | Date;
  horaVisita?: string;
  tipoVisita?: string;

  direccion?: string;
  entrecalles?: string;
  otraInfoDireccion?: string;

  estadoObra?: string;
  condicionVanos?: string[];
  medidasTomadas?: {
    alto?: string | number;
    ancho?: string | number;
    profundidad?: string | number;
    largo?: string | number;
    cantidad?: string | number;
  }[];
  tipoAberturaMedida?: string;

  materialSolicitado?: string;
  color?: string;
  vidriosConfirmados?: string;

  planosAdjuntos?: string[];
  fotosObra?: string[];

  firmaVerificacion?: string;
  observacionesTecnicas?: string;
  recomendacionTecnica?: string;
  estadoTareaVisita?: string;
};

export default function VisitaTecnicaFormModal({
  proyecto,
  onClose,
  onSaved,
}: Props) {
  const vt = (proyecto.visitaTecnica || {}) as VisitaTecnicaData;

  // Cliente
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

  const [estadoObraOptions, setEstadoObraOptions] = useState<string[]>(
    ESTADO_OBRA_BASE,
  );
  const [estadoObraOpen, setEstadoObraOpen] = useState(false);
  const [estadoObraSearch, setEstadoObraSearch] = useState("");

  const [tipoAberturaOpen, setTipoAberturaOpen] = useState(false);
  const [tipoVisitaOpen, setTipoVisitaOpen] = useState(false);

  const [form, setForm] = useState<FormState>(() => {
    let fecha = "";
    if (vt.fechaVisita) {
      const d = new Date(vt.fechaVisita);
      if (!Number.isNaN(d.getTime())) {
        fecha = d.toISOString().slice(0, 10); // YYYY-MM-DD
      }
    }

    const hora = vt.horaVisita || "";

    // Medidas tomadas iniciales
    let medidas: MedidaTomada[] = [];
    if (Array.isArray(vt.medidasTomadas) && vt.medidasTomadas.length) {
      medidas = vt.medidasTomadas.map((m) => ({
        alto: m.alto?.toString() ?? "",
        ancho: m.ancho?.toString() ?? "",
        profundidad: m.profundidad?.toString() ?? "",
        largo: m.largo?.toString() ?? "",
        cantidad: m.cantidad?.toString() ?? "",
      }));
    } else {
      medidas = [
        { alto: "", ancho: "", profundidad: "", largo: "", cantidad: "" },
      ];
    }

    return {
      clienteObraEmpresa: clienteNombre,

      asignadoA:
        typeof vt.asignadoA === "string"
          ? vt.asignadoA
          : vt.asignadoA?._id || "",
      fechaVisita: fecha,
      horaVisita: hora,
      tipoVisita: vt.tipoVisita || "",

      direccion: vt.direccion || "",
      entrecalles: vt.entrecalles || "",
      otraInfoDireccion: vt.otraInfoDireccion || "",

      estadoObra: vt.estadoObra || "",
      condicionVanos: vt.condicionVanos || [],
      medidasTomadas: medidas,
      tipoAberturaMedida: vt.tipoAberturaMedida || "",

      materialSolicitado: vt.materialSolicitado || "",
      color: vt.color || "",
      vidriosConfirmados: vt.vidriosConfirmados || "",

      planosAdjuntosText: (vt.planosAdjuntos || []).join("\n"),
      fotosObraText: (vt.fotosObra || []).join("\n"),

      firmaVerificacion: vt.firmaVerificacion || "",
      observacionesTecnicas: vt.observacionesTecnicas || "",
      recomendacionTecnica: vt.recomendacionTecnica || "",
      estadoTareaVisita: vt.estadoTareaVisita || "",

      planosAdjuntos: vt.planosAdjuntos || [],
      fotosObra: vt.fotosObra || [],
    };
  });

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
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

  // --- Medidas tomadas (dinámicas) ---
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
      medidasTomadas: [
        ...prev.medidasTomadas,
        { alto: "", ancho: "", profundidad: "", largo: "", cantidad: "" },
      ],
    }));
  };

  const removeMedida = (index: number) => {
    setForm((prev) => {
      const copy = [...prev.medidasTomadas];
      copy.splice(index, 1);
      return {
        ...prev,
        medidasTomadas:
          copy.length > 0
            ? copy
            : [{ alto: "", ancho: "", profundidad: "", largo: "", cantidad: "" }],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const planos = form.planosAdjuntosText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const fotos = form.fotosObraText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const medidasNormalizadas = (form.medidasTomadas || [])
        .map((m) => ({
          alto: m.alto.trim(),
          ancho: m.ancho.trim(),
          profundidad: m.profundidad.trim(),
          largo: m.largo.trim(),
          cantidad: m.cantidad.trim(),
        }))
        .filter((m) =>
          Object.values(m).some((v) => v !== ""),
        );

      const payload = {
        datosFormulario: {
          visitaTecnica: {
            asignadoA: form.asignadoA || undefined,
            fechaVisita: form.fechaVisita
              ? new Date(form.fechaVisita)
              : undefined,
            horaVisita: form.horaVisita || undefined,
            tipoVisita: form.tipoVisita || undefined,

            direccion: form.direccion || undefined,
            entrecalles: form.entrecalles || undefined,
            otraInfoDireccion: form.otraInfoDireccion || undefined,

            estadoObra: form.estadoObra || undefined,
            condicionVanos:
              form.condicionVanos && form.condicionVanos.length
                ? form.condicionVanos
                : undefined,
            medidasTomadas:
              medidasNormalizadas.length ? medidasNormalizadas : undefined,
            tipoAberturaMedida: form.tipoAberturaMedida || undefined,

            materialSolicitado: form.materialSolicitado || undefined,
            color: form.color || undefined,
            vidriosConfirmados: form.vidriosConfirmados || undefined,

            planosAdjuntos:
              planos.length
                ? planos
                : form.planosAdjuntos && form.planosAdjuntos.length
                ? form.planosAdjuntos
                : undefined,
            fotosObra:
              fotos.length
                ? fotos
                : form.fotosObra && form.fotosObra.length
                ? form.fotosObra
                : undefined,

            firmaVerificacion: form.firmaVerificacion || undefined,
            observacionesTecnicas: form.observacionesTecnicas || undefined,
            recomendacionTecnica: form.recomendacionTecnica || undefined,
            estadoTareaVisita: form.estadoTareaVisita || undefined,
          },
        },
      };

      await axios.put(`/api/proyectos/${proyecto._id}`, payload);

      toast.success("Visita técnica actualizada correctamente");
      onSaved?.();
      onClose?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: string } | undefined)?.error ??
          error.message;
        toast.error("Error al guardar la visita técnica: " + msg);
      } else {
        toast.error(
          "Error al guardar la visita técnica: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEstadoLabel =
    form.estadoObra || "Seleccionar estado de la obra";

  const handleCreateEstadoObra = () => {
    const nuevo = estadoObraSearch.trim();
    if (!nuevo) return;
    if (!estadoObraOptions.includes(nuevo)) {
      setEstadoObraOptions((prev) => [...prev, nuevo]);
    }
    updateField("estadoObra", nuevo);
    setEstadoObraSearch("");
    setEstadoObraOpen(false);
  };

  const selectedTipoAberturaLabel =
    form.tipoAberturaMedida || "Seleccionar tipo de abertura";

  return (
    <DialogContent className="sm:max-w-[900px] p-0">
      <ScrollArea className="max-h-[90vh] p-6">
        <DialogHeader>
          <DialogTitle>
            Editar Visita Técnica – {proyecto.numeroOrden}
          </DialogTitle>
          <DialogDescription>
            Completá los datos de la visita técnica, el estado de la obra y la
            documentación asociada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-8 py-4">
            {/* Cliente / Obra / Empresa */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="cliente-obra">Cliente, Obra, Empresa</Label>
              <Input
                id="cliente-obra"
                value={form.clienteObraEmpresa}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Datos de la visita */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Datos de la visita</h3>

              <div className="flex flex-col gap-2">
                <Label>Técnico asignado</Label>
                <UserSelect
                  value={form.asignadoA}
                  onChange={(val) => updateField("asignadoA", val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fecha-visita">Fecha de visita</Label>
                  <Input
                    id="fecha-visita"
                    type="date"
                    value={form.fechaVisita}
                    onChange={(e) =>
                      updateField("fechaVisita", e.target.value)
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="hora-visita">Hora de visita</Label>
                  <Input
                    id="hora-visita"
                    type="time"
                    value={form.horaVisita}
                    onChange={(e) =>
                      updateField("horaVisita", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Tipo de visita</Label>
                <Popover open={tipoVisitaOpen} onOpenChange={setTipoVisitaOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {form.tipoVisita || "Seleccionar tipo de visita"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar tipo..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron opciones.</CommandEmpty>
                        <CommandGroup>
                          {[
                            "Relevamiento",
                            "Control",
                            "Instalación",
                            "Reclamo",
                          ].map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("tipoVisita", opt);
                                setTipoVisitaOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.tipoVisita === opt
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

            {/* Dirección */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Dirección de la obra</h3>

              <div className="flex flex-col gap-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={form.direccion}
                  onChange={(e) =>
                    updateField("direccion", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="entrecalles">Entrecalles</Label>
                <Input
                  id="entrecalles"
                  value={form.entrecalles}
                  onChange={(e) =>
                    updateField("entrecalles", e.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="otra-info">Información adicional</Label>
                <Textarea
                  id="otra-info"
                  rows={3}
                  value={form.otraInfoDireccion}
                  onChange={(e) =>
                    updateField("otraInfoDireccion", e.target.value)
                  }
                  placeholder="Timbre, portería, piso/depto, código de acceso..."
                />
              </div>
            </div>

            {/* Estado de obra y vanos */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">
                Estado de la obra y vanos
              </h3>

              <div className="flex flex-col gap-2">
                <Label>Estado de la obra</Label>
                <Popover open={estadoObraOpen} onOpenChange={setEstadoObraOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedEstadoLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar estado o crear..."
                        value={estadoObraSearch}
                        onValueChange={setEstadoObraSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          No se encontraron estados.
                        </CommandEmpty>
                        <CommandGroup heading="Estados">
                          {estadoObraOptions.map((opt) => (
                            <CommandItem
                              key={opt}
                              value={opt}
                              onSelect={() => {
                                updateField("estadoObra", opt);
                                setEstadoObraOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.estadoObra === opt
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="flex-1">{opt}</span>
                              <Trash2
                                className="h-3 w-3 text-destructive opacity-60 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEstadoObraOptions((prev) =>
                                    prev.filter((o) => o !== opt),
                                  );
                                  if (form.estadoObra === opt) {
                                    updateField("estadoObra", "");
                                  }
                                }}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>

                        {estadoObraSearch.trim() &&
                          !estadoObraOptions.includes(
                            estadoObraSearch.trim(),
                          ) && (
                            <CommandGroup heading="Acciones">
                              <CommandItem
                                value={estadoObraSearch.trim()}
                                onSelect={handleCreateEstadoObra}
                              >
                                Crear &quot;
                                {estadoObraSearch.trim()}
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
                <Label>Condición de vanos</Label>
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
            </div>

            {/* Medidas tomadas */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Medidas tomadas</h3>
              <p className="text-sm text-muted-foreground">
                Agregá todas las medidas necesarias. Cada fila corresponde a un
                vano o elemento medido.
              </p>

              <div className="flex flex-col gap-3">
                {form.medidasTomadas.map((m, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 flex flex-col gap-3 bg-card/40"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Medida #{index + 1}
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

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Alto</Label>
                        <Input
                          value={m.alto}
                          onChange={(e) =>
                            updateMedida(index, "alto", e.target.value)
                          }
                          placeholder="Ej: 120"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Ancho</Label>
                        <Input
                          value={m.ancho}
                          onChange={(e) =>
                            updateMedida(index, "ancho", e.target.value)
                          }
                          placeholder="Ej: 80"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Profundidad</Label>
                        <Input
                          value={m.profundidad}
                          onChange={(e) =>
                            updateMedida(index, "profundidad", e.target.value)
                          }
                          placeholder="Ej: 15"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Largo</Label>
                        <Input
                          value={m.largo}
                          onChange={(e) =>
                            updateMedida(index, "largo", e.target.value)
                          }
                          placeholder="Ej: 200"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          value={m.cantidad}
                          onChange={(e) =>
                            updateMedida(index, "cantidad", e.target.value)
                          }
                          placeholder="Ej: 2"
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
                Agregar medida
              </Button>

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
            </div>

            {/* Configuración técnica, estados y recomendaciones */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold">Configuración técnica</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="material">Material solicitado</Label>
                  <Input
                    id="material"
                    value={form.materialSolicitado}
                    onChange={(e) =>
                      updateField("materialSolicitado", e.target.value)
                    }
                    placeholder="Aluminio, PVC, etc."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={form.color}
                    onChange={(e) =>
                      updateField("color", e.target.value)
                    }
                    placeholder="Negro texturado, Nogal, Blanco..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="vidrios">Vidrios confirmados</Label>
                  <Input
                    id="vidrios"
                    value={form.vidriosConfirmados}
                    onChange={(e) =>
                      updateField("vidriosConfirmados", e.target.value)
                    }
                    placeholder="Sí / Parcial / No / Pendiente"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="obs-tec">Observaciones técnicas</Label>
                <Textarea
                  id="obs-tec"
                  rows={3}
                  value={form.observacionesTecnicas}
                  onChange={(e) =>
                    updateField("observacionesTecnicas", e.target.value)
                  }
                />
              </div>

              {/* Estado de la tarea de visita */}
              <div className="flex flex-col gap-2">
                <Label>Estado de la tarea de visita</Label>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS_TAREA_VISITA.map((estado) => (
                    <Button
                      key={estado}
                      type="button"
                      size="sm"
                      variant={
                        form.estadoTareaVisita === estado
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("estadoTareaVisita", estado)
                      }
                    >
                      {estado}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Recomendación técnica */}
              <div className="flex flex-col gap-2">
                <Label>Recomendación técnica</Label>
                <div className="flex flex-wrap gap-2">
                  {RECOMENDACION_TECNICA_OPTIONS.map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={
                        form.recomendacionTecnica === opt
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        updateField("recomendacionTecnica", opt)
                      }
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Documentación y firma */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">
                  Documentación gráfica
                </h3>

                <CloudinaryMultiUpload
                  label="Planos o croquis adjuntos (1 a 3)"
                  helper="Imágenes de planos o croquis. Máximo 3 archivos."
                  value={form.planosAdjuntos}
                  onChange={(urls) => updateField("planosAdjuntos", urls)}
                  maxFiles={3}
                  folder="tinco/visitas-tecnicas/planos"
                />

                <CloudinaryMultiUpload
                  label="Fotos de obra (3 a 5 imágenes / videos)"
                  helper="Fotos generales y de detalle de la obra."
                  value={form.fotosObra}
                  onChange={(urls) => updateField("fotosObra", urls)}
                  maxFiles={5}
                  folder="tinco/visitas-tecnicas/fotos"
                />
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold">Verificación</h3>
                <FirmaDigitalField
                  value={form.firmaVerificacion}
                  onChange={(url) => updateField("firmaVerificacion", url)}
                />
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
