"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { Loader2, ArrowUpDown, Filter, Search } from "lucide-react";
import { toast } from "sonner";

import type { IProyecto } from "@/models/Proyecto";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

import MedicionFormModal from "@/components/proyectos/FormMedicion";
import { MedicionView } from "@/components/proyectos/MedicionView";
import VisitaTecnicaForm from "@/components/proyectos/FormVisitaTecnica";
import { VisitaTecnicaView } from "@/components/proyectos/VisitaTecnicaView";

// 🔹 VERIFICACIÓN
import VerificacionFormModal from "@/components/proyectos/FormVerificacion";
import { VerificacionView } from "@/components/proyectos/VerificacionView";

// 🔹 TALLER
import TallerFormModal from "@/components/proyectos/FormTaller";
import { TallerView } from "@/components/proyectos/TallerView";

type DestinoEstado = "Medición" | "Verificación" | "Taller" | "Depósito" | "Logística";

const ESTADOS_INICIALES: DestinoEstado[] = [
  "Medición",
  "Verificación",
  "Taller",
  "Depósito",
  "Logística",
];

type AsignadoARef =
  | {
      name?: string;
      _id?: string;
    }
  | string
  | null
  | undefined;

interface VisitaTecnicaLite {
  asignadoA?: AsignadoARef;
  fechaVisita?: string | Date | null;
  horaVisita?: string | null;
  direccion?: string;
  entrecalles?: string;
  estadoObra?: string;
  tipoVisita?: string;
  recomendacionTecnica?: string;
  condicionVanos?: string[];
  tipoAberturaMedida?: string;
  materialSolicitado?: string;
}

interface ClienteLite {
  nombreCompleto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

interface VendedorLite {
  name?: string;
}

/**
 * Extendemos el tipo de Proyecto para evitar casts "any" al leer estadoActual y refs populadas.
 * No cambia el runtime; solo tipado local.
 */
type ProyectoLite = IProyecto & {
  estadoActual?: string | null;
  visitaTecnica?: VisitaTecnicaLite;
  cliente?: ClienteLite | string | null;
  vendedor?: VendedorLite | string | null;
};

type Filters = {
  recomendacionTecnica: string;
  tecnico: string;
  estadoObra: string;
  tipoVisita: string;
  condicionVano: string;
  tipoAbertura: string;
  materialSolicitado: string;
  estado: string;
  vendedor: string;
};

const ALL_VALUE = "__all__";

const getEstadoBadgeColor = (estado?: string | null) => {
  if (!estado) return "bg-primary/15 text-primary hover:bg-primary/20";
  switch (estado) {
    case "Taller":
      return "bg-orange-500 hover:bg-orange-600";
    case "Logística":
      return "bg-blue-500 hover:bg-blue-600";
    case "Completado":
      return "bg-green-600 hover:bg-green-700";
    case "Visita Técnica":
      return "bg-purple-500 hover:bg-purple-600";
    case "Medición":
      return "bg-purple-600 hover:bg-purple-700";
    case "Verificación":
      return "bg-yellow-600 hover:bg-yellow-700 text-black";
    case "Depósito":
      return "bg-slate-600 hover:bg-slate-700";
    default:
      return "bg-gray-400 hover:bg-gray-500";
  }
};

function toClienteLite(ref: ClienteLite | string | null | undefined): ClienteLite {
  return ref && typeof ref === "object" ? ref : {};
}

function toVendedorLite(ref: VendedorLite | string | null | undefined): VendedorLite {
  return ref && typeof ref === "object" ? ref : {};
}

function getTecnicoLabel(asignadoA: AsignadoARef): string {
  if (!asignadoA) return "";
  if (typeof asignadoA === "string") return asignadoA;
  return asignadoA.name ?? "";
}

async function fetchProyectosVisitaTecnica(): Promise<ProyectoLite[]> {
  const { data } = await axios.get("/api/proyectos", {
    params: {
      estados: "Visita Técnica,Medición,Verificación,Taller,Depósito,Logística",
      sinEstado: "1",
    },
  });
  return data.data as ProyectoLite[];
}

export default function VisitaTecnicaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [proyectoAPasar, setProyectoAPasar] = useState<{
    proyecto: ProyectoLite;
    destino: DestinoEstado;
  } | null>(null);

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<ProyectoLite | null>(null);

  const [viewStage, setViewStage] = useState<
    "visitaTecnica" | "medicion" | "verificacion" | "taller" | null
  >(null);

  const [estadoDialog, setEstadoDialog] = useState<{ proyecto: ProyectoLite } | null>(null);

  const [estadoSeleccionado, setEstadoSeleccionado] = useState<DestinoEstado | "">("");

  const [proyectoEditandoVisita, setProyectoEditandoVisita] = useState<ProyectoLite | null>(null);
  const [proyectoEditandoMedicion, setProyectoEditandoMedicion] = useState<ProyectoLite | null>(
    null,
  );
  const [proyectoEditandoVerificacion, setProyectoEditandoVerificacion] =
    useState<ProyectoLite | null>(null);
  const [proyectoEditandoTaller, setProyectoEditandoTaller] = useState<ProyectoLite | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState<Filters>({
    recomendacionTecnica: "",
    tecnico: "",
    estadoObra: "",
    tipoVisita: "",
    condicionVano: "",
    tipoAbertura: "",
    materialSolicitado: "",
    estado: "",
    vendedor: "",
  });

  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);

  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);

  const { data: proyectos, isLoading, isError } = useQuery({
    queryKey: ["proyectos-visita-tecnica"],
    queryFn: fetchProyectosVisitaTecnica,
  });

  const setEstadoActualMutation = useMutation({
    mutationFn: async ({ proyectoId, estado }: { proyectoId: string; estado: DestinoEstado }) => {
      return axios.put(`/api/proyectos/${proyectoId}`, { forzarEstado: estado });
    },
    onSuccess: async () => {
      toast.success("Estado asignado");
      await queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });

      const p = estadoDialog?.proyecto;
      const estado = estadoSeleccionado;

      setEstadoDialog(null);
      setEstadoSeleccionado("");

      if (p && estado) {
        const proyectoActualizado: ProyectoLite = { ...p, estadoActual: estado };
        setProyectoSeleccionado(proyectoActualizado);

        if (estado === "Medición") setViewStage("medicion");
        else if (estado === "Verificación") setViewStage("verificacion");
        else if (estado === "Taller") setViewStage("taller");
        else setViewStage("visitaTecnica");
      }
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: string } | undefined)?.error || error.message
        : error instanceof Error
          ? error.message
          : "Error desconocido";
      toast.error("No se pudo asignar el estado: " + message);
    },
  });

  const filterOptions = useMemo(() => {
    const recomendacionSet = new Set<string>();
    const tecnicoSet = new Set<string>();
    const estadoObraSet = new Set<string>();
    const tipoVisitaSet = new Set<string>();
    const condicionVanoSet = new Set<string>();
    const tipoAberturaSet = new Set<string>();
    const materialSet = new Set<string>();
    const estadoSet = new Set<string>();
    const vendedorSet = new Set<string>();

    proyectos?.forEach((p) => {
      const vt = p.visitaTecnica ?? {};
      const vendedorRef = toVendedorLite(p.vendedor);

      const tecnicoLabel = getTecnicoLabel(vt.asignadoA);
      if (tecnicoLabel) tecnicoSet.add(tecnicoLabel);

      if (vendedorRef.name) vendedorSet.add(vendedorRef.name);
      else if (typeof p.vendedor === "string") vendedorSet.add(p.vendedor);

      if (vt.recomendacionTecnica) recomendacionSet.add(vt.recomendacionTecnica);
      if (vt.estadoObra) estadoObraSet.add(vt.estadoObra);
      if (vt.tipoVisita) tipoVisitaSet.add(vt.tipoVisita);

      (vt.condicionVanos ?? []).forEach((c) => {
        if (c) condicionVanoSet.add(c);
      });

      if (vt.tipoAberturaMedida) tipoAberturaSet.add(vt.tipoAberturaMedida);
      if (vt.materialSolicitado) materialSet.add(vt.materialSolicitado);
      if (p.estadoActual) estadoSet.add(p.estadoActual);
    });

    return {
      recomendacionTecnica: Array.from(recomendacionSet),
      tecnico: Array.from(tecnicoSet),
      estadoObra: Array.from(estadoObraSet),
      tipoVisita: Array.from(tipoVisitaSet),
      condicionVano: Array.from(condicionVanoSet),
      tipoAbertura: Array.from(tipoAberturaSet),
      materialSolicitado: Array.from(materialSet),
      estado: Array.from(estadoSet),
      vendedor: Array.from(vendedorSet),
    };
  }, [proyectos]);

  const pasarEtapaMutation = useMutation({
    mutationFn: ({ proyectoId, destino }: { proyectoId: string; destino: DestinoEstado }) =>
      axios.put(`/api/proyectos/${proyectoId}`, {
        etapaACompletar: "visitaTecnica",
        datosFormulario: {},
        forzarEstado: destino,
      }),
    onSuccess: (_data, variables) => {
      toast.success(`Proyecto pasado a ${variables.destino}`);
      queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
      setProyectoAPasar(null);
    },
    onError: (error: unknown) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { error?: string } | undefined)?.error || error.message
        : error instanceof Error
          ? error.message
          : "Error desconocido";

      toast.error("Error al cambiar de estado: " + message);
      setProyectoAPasar(null);
    },
  });

  const columns = useMemo<ColumnDef<ProyectoLite>[]>(() => {
    return [
      {
        accessorKey: "numeroOrden",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            N° Orden
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <span className="font-semibold">{row.original.numeroOrden}</span>,
      },
      {
        accessorKey: "cliente.nombreCompleto",
        header: "Cliente",
        cell: ({ row }) => {
          const clienteLite = toClienteLite(row.original.cliente);
          return clienteLite.nombreCompleto || "N/A";
        },
      },
      {
        accessorKey: "visitaTecnica.asignadoA",
        header: "Técnico Asignado",
        cell: ({ row }) => {
          const vt = row.original.visitaTecnica;
          if (!vt) return "Sin asignar";
          const label = getTecnicoLabel(vt.asignadoA);
          return label || "Sin asignar";
        },
      },
      {
        accessorKey: "visitaTecnica.fechaVisita",
        header: "Fecha Visita",
        cell: ({ row }) => {
          const vt = row.original.visitaTecnica;
          if (!vt?.fechaVisita) return "-";
          const fecha = new Date(vt.fechaVisita);
          if (Number.isNaN(fecha.getTime())) return "-";
          return fecha.toLocaleDateString();
        },
      },
      {
        accessorKey: "visitaTecnica.horaVisita",
        header: "Hora Visita",
        cell: ({ row }) => row.original.visitaTecnica?.horaVisita || "-",
      },
      {
        accessorKey: "visitaTecnica.direccion",
        header: "Dirección",
        cell: ({ row }) => row.original.visitaTecnica?.direccion || "-",
      },
      {
        accessorKey: "visitaTecnica.estadoObra",
        header: "Estado Obra",
        cell: ({ row }) => row.original.visitaTecnica?.estadoObra || "-",
      },
      {
        accessorKey: "visitaTecnica.tipoVisita",
        header: "Tipo Visita",
        cell: ({ row }) => row.original.visitaTecnica?.tipoVisita || "-",
      },
      {
        accessorKey: "estadoActual",
        header: "Estado",
        cell: ({ row }) => {
          const estado = row.original.estadoActual ?? null;
          return <Badge className={getEstadoBadgeColor(estado)}>{estado || "Sin estado"}</Badge>;
        },
      },
    ];
  }, []);

  const filteredData: ProyectoLite[] = useMemo(() => {
    if (!proyectos) return [];

    const q = searchTerm.trim().toLowerCase();

    return proyectos.filter((p) => {
      const vt = p.visitaTecnica ?? {};
      const cliente = toClienteLite(p.cliente);
      const vendedor = toVendedorLite(p.vendedor);

      if (filters.recomendacionTecnica && vt.recomendacionTecnica !== filters.recomendacionTecnica)
        return false;

      if (filters.tecnico) {
        const tecnicoLabel = getTecnicoLabel(vt.asignadoA);
        if (tecnicoLabel !== filters.tecnico) return false;
      }

      if (filters.estadoObra && vt.estadoObra !== filters.estadoObra) return false;
      if (filters.tipoVisita && vt.tipoVisita !== filters.tipoVisita) return false;

      if (filters.condicionVano) {
        const arr = vt.condicionVanos ?? [];
        if (!arr.includes(filters.condicionVano)) return false;
      }

      if (filters.tipoAbertura && vt.tipoAberturaMedida !== filters.tipoAbertura) return false;

      if (filters.materialSolicitado && vt.materialSolicitado !== filters.materialSolicitado)
        return false;

      if (filters.estado && (p.estadoActual ?? "") !== filters.estado) return false;

      if (filters.vendedor) {
        const vendedorLabel = vendedor.name || (typeof p.vendedor === "string" ? p.vendedor : "");
        if (vendedorLabel !== filters.vendedor) return false;
      }

      if (q) {
        const vendedorLabel = vendedor.name || (typeof p.vendedor === "string" ? p.vendedor : "");
        const textoBusqueda = [
          cliente.nombreCompleto,
          cliente.telefono,
          cliente.email,
          cliente.direccion,
          vt.direccion,
          vt.entrecalles,
          p.numeroOrden,
          p.estadoActual,
          vendedorLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!textoBusqueda.includes(q)) return false;
      }

      return true;
    });
  }, [proyectos, filters, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-10 text-red-500">Error al cargar las visitas técnicas.</div>;
  }

  const stageLabel =
    viewStage === "medicion"
      ? "Medición"
      : viewStage === "verificacion"
        ? "Verificación"
        : viewStage === "taller"
          ? "Taller"
          : "Visita Técnica";

  const stageDescription =
    viewStage === "medicion"
      ? "Vista general del proyecto y de la medición. Desde aquí podés revisar los datos y luego editar si es necesario."
      : viewStage === "verificacion"
        ? "Vista general del proyecto y de la verificación. Desde aquí podés revisar los datos y luego editar si es necesario."
        : viewStage === "taller"
          ? "Vista general del proyecto y del trabajo de taller. Desde aquí podés revisar los datos y luego editar si es necesario."
          : "Vista general del proyecto y de la visita técnica. Desde aquí podés revisar los datos y luego editar si es necesario.";

  return (
    <div className="container mx-auto py-10">
      {/* Modal para confirmar cambio de estado */}
      <AlertDialog open={!!proyectoAPasar} onOpenChange={() => setProyectoAPasar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar estado del proyecto</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a marcar la etapa de <strong>Visita Técnica</strong> como completada y el proyecto{" "}
              <strong>{proyectoAPasar?.proyecto.numeroOrden}</strong> pasará al estado{" "}
              <strong>{proyectoAPasar?.destino}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => {
                if (proyectoAPasar) {
                  pasarEtapaMutation.mutate({
                    proyectoId: proyectoAPasar.proyecto._id as unknown as string,
                    destino: proyectoAPasar.destino,
                  });
                }
              }}
              disabled={pasarEtapaMutation.isPending}
            >
              {pasarEtapaMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </div>
              ) : (
                "Sí, cambiar estado"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: seleccionar estado inicial si no tiene estado */}
      <Dialog
        open={!!estadoDialog}
        onOpenChange={(open) => {
          if (!open) {
            setEstadoDialog(null);
            setEstadoSeleccionado("");
          }
        }}
      >
        {estadoDialog && (
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Seleccionar estado inicial</DialogTitle>
              <DialogDescription>
                Este proyecto fue creado sin estado. Elegí el estado inicial para continuar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <Select
                value={estadoSeleccionado}
                onValueChange={(v) => setEstadoSeleccionado(v as DestinoEstado)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegí un estado..." />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_INICIALES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEstadoDialog(null);
                    setEstadoSeleccionado("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!estadoSeleccionado || setEstadoActualMutation.isPending}
                  onClick={() => {
                    if (!estadoDialog?.proyecto?._id || !estadoSeleccionado) return;
                    setEstadoActualMutation.mutate({
                      proyectoId: estadoDialog.proyecto._id as unknown as string,
                      estado: estadoSeleccionado,
                    });
                  }}
                >
                  {setEstadoActualMutation.isPending ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    "Confirmar"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal de vista del proyecto */}
      <Dialog
        open={!!proyectoSeleccionado}
        onOpenChange={(open) => {
          if (!open) {
            setProyectoSeleccionado(null);
            setViewStage(null);
          }
        }}
      >
        {proyectoSeleccionado && (
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {proyectoSeleccionado.numeroOrden} – {stageLabel}
              </DialogTitle>
              <DialogDescription>{stageDescription}</DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {viewStage === "medicion" ? (
                <MedicionView
                  proyecto={proyectoSeleccionado}
                  onDeleted={() => {
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                    queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
                  }}
                />
              ) : viewStage === "verificacion" ? (
                <VerificacionView
                  proyecto={proyectoSeleccionado}
                  onDeleted={() => {
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                    queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
                  }}
                />
              ) : viewStage === "taller" ? (
                <TallerView proyecto={proyectoSeleccionado} />
              ) : (
                <VisitaTecnicaView
                  proyecto={proyectoSeleccionado}
                  onDeleted={() => {
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                    queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
                  }}
                />
              )}
            </div>

            <div className="mt-6 flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setProyectoSeleccionado(null);
                  setViewStage(null);
                }}
              >
                Cerrar
              </Button>

              {viewStage === "medicion" ? (
                <Button
                  onClick={() => {
                    setProyectoEditandoMedicion(proyectoSeleccionado);
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                  }}
                >
                  Editar medición
                </Button>
              ) : viewStage === "verificacion" ? (
                <Button
                  onClick={() => {
                    setProyectoEditandoVerificacion(proyectoSeleccionado);
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                  }}
                >
                  Editar verificación
                </Button>
              ) : viewStage === "taller" ? (
                <Button
                  onClick={() => {
                    setProyectoEditandoTaller(proyectoSeleccionado);
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                  }}
                >
                  Editar taller
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setProyectoEditandoVisita(proyectoSeleccionado);
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                  }}
                >
                  Editar visita técnica
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Edit modals */}
      <Dialog
        open={!!proyectoEditandoVisita}
        onOpenChange={(open) => {
          if (!open) {
            setProyectoEditandoVisita(null);
            queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
          }
        }}
      >
        {proyectoEditandoVisita && (
          <VisitaTecnicaForm
            proyecto={proyectoEditandoVisita}
            onClose={() => setProyectoEditandoVisita(null)}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] })}
          />
        )}
      </Dialog>

      <Dialog
        open={!!proyectoEditandoMedicion}
        onOpenChange={(open) => {
          if (!open) {
            setProyectoEditandoMedicion(null);
            queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
          }
        }}
      >
        {proyectoEditandoMedicion && (
          <MedicionFormModal
            proyecto={proyectoEditandoMedicion}
            onClose={() => setProyectoEditandoMedicion(null)}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] })}
          />
        )}
      </Dialog>

      <Dialog
        open={!!proyectoEditandoVerificacion}
        onOpenChange={(open) => {
          if (!open) {
            setProyectoEditandoVerificacion(null);
            queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
          }
        }}
      >
        {proyectoEditandoVerificacion && (
          <VerificacionFormModal
            proyecto={proyectoEditandoVerificacion}
            onClose={() => setProyectoEditandoVerificacion(null)}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] })}
          />
        )}
      </Dialog>

      <Dialog
        open={!!proyectoEditandoTaller}
        onOpenChange={(open) => {
          if (!open) {
            setProyectoEditandoTaller(null);
            queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] });
          }
        }}
      >
        {proyectoEditandoTaller && (
          <TallerFormModal
            proyecto={proyectoEditandoTaller}
            onClose={() => setProyectoEditandoTaller(null)}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["proyectos-visita-tecnica"] })}
          />
        )}
      </Dialog>

      {/* Header + buscador + filtros */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Tareas</h1>
          <p className="text-muted-foreground">
            Proyectos en etapas de visita técnica, medición, verificación, taller, depósito y
            logística. Podés ver el detalle, editar los formularios o pasarlos directamente a la
            siguiente etapa del flujo.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, estado, vendedor o N° de orden..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={hasActiveFilters ? "default" : "outline"}
                  size="sm"
                  className="inline-flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-primary-foreground/10 px-2 py-0.5 text-xs">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>

              <PopoverContent align="end" className="w-[320px] sm:w-[520px] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Filtros avanzados</p>
                    <p className="text-xs text-muted-foreground">
                      Filtrá las visitas por técnico, estado, tipo de visita, vendedor y más.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() =>
                      setFilters({
                        recomendacionTecnica: "",
                        tecnico: "",
                        estadoObra: "",
                        tipoVisita: "",
                        condicionVano: "",
                        tipoAbertura: "",
                        materialSolicitado: "",
                        estado: "",
                        vendedor: "",
                      })
                    }
                    disabled={!hasActiveFilters}
                  >
                    Limpiar
                  </Button>
                </div>

                <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={filters.recomendacionTecnica || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, recomendacionTecnica: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Recomendación técnica" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                      {filterOptions.recomendacionTecnica.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.tecnico || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, tecnico: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                      {filterOptions.tecnico.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.vendedor || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, vendedor: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                      {filterOptions.vendedor.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.estadoObra || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, estadoObra: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Estado de la obra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                      {filterOptions.estadoObra.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.tipoVisita || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, tipoVisita: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo de visita" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                      {filterOptions.tipoVisita.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.condicionVano || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, condicionVano: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Condición de vanos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                      {filterOptions.condicionVano.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.tipoAbertura || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, tipoAbertura: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Tipo de abertura" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                      {filterOptions.tipoAbertura.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.materialSolicitado || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, materialSolicitado: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Material solicitado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                      {filterOptions.materialSolicitado.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.estado || ALL_VALUE}
                    onValueChange={(val) =>
                      setFilters((f) => ({ ...f, estado: val === ALL_VALUE ? "" : val }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Estado del proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                      {filterOptions.estado.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="outline" onClick={() => router.push("/dashboard/proyectos")}>
              Volver al Tablero General
            </Button>
          </div>
        </div>
      </div>

      {filteredData.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredData}
          onRowClick={(row) => {
            const proyecto = row.original as ProyectoLite;
            const estado = proyecto.estadoActual ?? null;

            if (!estado) {
              setEstadoDialog({ proyecto });
              setEstadoSeleccionado("");
              return;
            }

            setProyectoSeleccionado(proyecto);

            if (estado === "Medición") setViewStage("medicion");
            else if (estado === "Verificación") setViewStage("verificacion");
            else if (estado === "Taller") setViewStage("taller");
            else setViewStage("visitaTecnica");
          }}
        />
      ) : (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          No hay proyectos que coincidan con los filtros seleccionados en estado{" "}
          <strong>Visita Técnica / Medición / Verificación / Taller / Depósito / Logística</strong>.
        </div>
      )}
    </div>
  );
}
