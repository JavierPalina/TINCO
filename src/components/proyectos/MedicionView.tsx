"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ProyectoDTO } from "@/types/proyecto";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
import { Trash2, Loader2, CheckCircle2, XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { exportElementToPdf } from "@/lib/pdf/exportElementToPdf";

type Props = {
  proyecto: ProyectoDTO;
  /** Se llama cuando se eliminó o cambió el proyecto y el padre debe refrescar */
  onDeleted?: () => void;
};

type EtapaCotizacion = {
  _id: string;
  nombre: string;
  color: string;
};

// Proyecto con campos extra que usamos acá
type ProyectoWithExtras = ProyectoDTO & {
  cotizacion?: string | { _id?: string };
  medicion?: MedicionData | null;
  cliente?: {
    nombreCompleto?: string;
  } | null;

  // opcional por si lo agregaste
  progresoEstado?: string | null;
  prioridad?: string | null;
  fechaLimite?: string | Date | null;
};

// Medición
type MedicionMedida = {
  alto?: string | number;
  ancho?: string | number;
  profundidad?: string | number;
  largo?: string | number;
  cantidad?: string | number;
};

type MedicionData = {
  medidasTomadas?: MedicionMedida[];
  condicionVanos?: string[];
  planosAdjuntos?: string[];
  fotosMedicion?: string[];
  fechaMedicion?: string | Date;

  asignadoA?: { name?: string } | string | null;
  numeroOrdenMedicion?: string;
  tipoAberturaMedida?: string;

  direccionObra?: string;
  clienteObraEmpresa?: string;
  cantidadAberturasMedidas?: number | string;

  toleranciasRecomendadas?: string;
  estadoObraMedicion?: string;
  tipoPerfilPrevisto?: string;
  color?: string;
  tipoVidrioSolicitado?: string;

  observacionesMedicion?: string;
  estadoFinalMedicion?: string;
  enviarAVerificacion?: string;
  firmaValidacionTecnico?: string;
};

// estados a los que se puede pasar con el botón "Finalizar"
const NEXT_ESTADOS: string[] = [
  "Visita Técnica",
  "Medición",
  "Verificación",
  "Taller",
  "Depósito",
  "Logística",
];

const getEstadoBadgeColor = (estado?: string | null) => {
  if (!estado) return "bg-gray-400 hover:bg-gray-500";
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
    case "Rechazado":
      return "bg-red-600 hover:bg-red-700";
    default:
      return "bg-gray-400 hover:bg-gray-500";
  }
};

const getProgresoBadgeColor = (p?: string | null) => {
  if (!p) return "bg-muted text-muted-foreground";
  if (p === "Finalizado") return "bg-green-600 hover:bg-green-700";
  if (p === "Iniciado") return "bg-blue-600 hover:bg-blue-700";
  return "bg-slate-500 hover:bg-slate-600";
};

/**
 * Obtiene el ObjectId de la cotización asociada al proyecto,
 * ya sea que venga populado o como string suelto.
 */
type CotizacionRefLike =
  | string
  | { _id?: string | { toString: () => string } }
  | null
  | undefined;

type HasToString = { toString: () => string };

const hasToString = (v: unknown): v is HasToString =>
  typeof v === "object" &&
  v !== null &&
  "toString" in v &&
  typeof (v as HasToString).toString === "function";

const getCotizacionIdFromProyecto = (
  proyecto: { cotizacion?: CotizacionRefLike } | null | undefined,
): string | null => {
  if (!proyecto) return null;

  const cot = proyecto.cotizacion;

  if (typeof cot === "string") return cot;

  if (cot && typeof cot === "object") {
    const id = (cot as { _id?: unknown })._id;

    if (typeof id === "string") return id;
    if (hasToString(id)) return id.toString();

    return null;
  }

  return null;
};

export function MedicionView({ proyecto, onDeleted }: Props) {
  const proyectoExtras = proyecto as ProyectoWithExtras;

  // ✅ Para PDF
  const pdfRef = useRef<HTMLDivElement | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Eliminar SOLO la medición
  const [deleteMedicionOpen, setDeleteMedicionOpen] = useState(false);
  const [isDeletingMedicion, setIsDeletingMedicion] = useState(false);

  // Eliminar / rechazar proyecto
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Terminar proyecto
  const [isTerminatingProject, setIsTerminatingProject] = useState(false);

  // Dialog para "Finalizado" → elegir próximo estado
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedNextEstado, setSelectedNextEstado] = useState<string | null>(null);
  const [isMovingEstado, setIsMovingEstado] = useState(false);

  const md: MedicionData = proyectoExtras.medicion || {};
  const cliente = proyectoExtras.cliente || {};

  const medidas: MedicionMedida[] = Array.isArray(md.medidasTomadas) ? md.medidasTomadas : [];
  const condicionVanos: string[] = Array.isArray(md.condicionVanos) ? md.condicionVanos : [];
  const planos: string[] = Array.isArray(md.planosAdjuntos) ? md.planosAdjuntos : [];
  const fotos: string[] = Array.isArray(md.fotosMedicion) ? md.fotosMedicion : [];

  const fechaMedicion =
    md?.fechaMedicion && !Number.isNaN(new Date(md.fechaMedicion).getTime())
      ? new Date(md.fechaMedicion).toLocaleDateString()
      : "-";

  // Traemos etapas de cotización (pipeline) para mover a "Proyecto Finalizado" / "Proyectos no realizados"
  const { data: etapasCotizacion, isLoading: isLoadingEtapas } = useQuery<EtapaCotizacion[]>({
    queryKey: ["etapasCotizacion"],
    queryFn: async () => {
      const { data } = await axios.get<{ data: EtapaCotizacion[] }>("/api/etapas-cotizacion");
      return data.data;
    },
  });

  const findEtapaIdByNombre = (nombre: string): string | null => {
    if (!etapasCotizacion) return null;
    const etapa = etapasCotizacion.find((e) => e.nombre === nombre);
    return etapa?._id ?? null;
  };

  const moveCotizacionToEtapa = async (nombreEtapa: string) => {
    const cotizacionId = getCotizacionIdFromProyecto(proyectoExtras);
    if (!cotizacionId) {
      toast.error("Este proyecto no tiene una cotización asociada.");
      return;
    }

    const etapaId = findEtapaIdByNombre(nombreEtapa);
    if (!etapaId) {
      toast.error(`No se encontró la etapa "${nombreEtapa}" en el pipeline de cotizaciones.`);
      return;
    }

    await axios.put(`/api/cotizaciones/${cotizacionId}`, { etapa: etapaId });
  };

  const handleConfirmDeleteMedicion = async () => {
    try {
      setIsDeletingMedicion(true);

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        datosFormulario: {
          medicion: {},
        },
      });

      toast.success("Medición eliminada correctamente");
      setDeleteMedicionOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: string } | undefined)?.error ?? error.message;
        toast.error("Error al eliminar la medición: " + msg);
      } else {
        toast.error(
          "Error al eliminar la medición: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsDeletingMedicion(false);
    }
  };

  const handleEliminarProyecto = async () => {
    try {
      setIsDeletingProject(true);

      await moveCotizacionToEtapa("Proyectos no realizados");

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        estadoActual: "Rechazado",
      });

      await axios.delete(`/api/proyectos/${proyecto._id}`);

      toast.success(
        "Proyecto eliminado y cotización movida a 'Proyectos no realizados' en el pipeline.",
      );
      setDeleteProjectOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: string } | undefined)?.error ?? error.message;
        toast.error("Error al eliminar el proyecto: " + msg);
      } else {
        toast.error(
          "Error al eliminar el proyecto: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsDeletingProject(false);
    }
  };

  const handleTerminarProyecto = async () => {
    try {
      setIsTerminatingProject(true);

      await moveCotizacionToEtapa("Proyecto Finalizado");

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        estadoActual: "Completado",
      });

      toast.success("Proyecto completado y cotización movida a 'Proyecto Finalizado'.");
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: string } | undefined)?.error ?? error.message;
        toast.error("Error al terminar el proyecto: " + msg);
      } else {
        toast.error(
          "Error al terminar el proyecto: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsTerminatingProject(false);
    }
  };

  const handleConfirmMoveEstado = async () => {
    if (!selectedNextEstado) {
      toast.error("Seleccioná a dónde querés pasar la orden.");
      return;
    }

    try {
      setIsMovingEstado(true);

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        estadoActual: selectedNextEstado,
      });

      toast.success(`Proyecto movido a "${selectedNextEstado}".`);
      setMoveDialogOpen(false);
      setSelectedNextEstado(null);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const msg =
          (error.response?.data as { error?: string } | undefined)?.error ?? error.message;
        toast.error("Error al mover el proyecto: " + msg);
      } else {
        toast.error(
          "Error al mover el proyecto: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsMovingEstado(false);
    }
  };

  const estadoLabel = proyecto.estadoActual ?? "Sin estado";

  const handleExportPdf = async () => {
    const el = pdfRef.current;
    if (!el) return;

    try {
      setIsExportingPdf(true);
      await exportElementToPdf({
        element: el,
        filename: `Medicion-${proyecto.numeroOrden}.pdf`,
        title: `Medición – ${proyecto.numeroOrden}`,
      });
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Acciones top */}
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
        >
          {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Descargar PDF
        </Button>
      </div>

      {/* ✅ Todo lo que esté dentro de este contenedor se captura para el PDF */}
      <div ref={pdfRef} className="rounded-lg border bg-white p-6">
        {/* Alert para confirmar eliminación de MEDICIÓN */}
        <AlertDialog open={deleteMedicionOpen} onOpenChange={setDeleteMedicionOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar datos de la medición?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará todos los datos cargados en la medición del proyecto{" "}
                <strong>{proyecto.numeroOrden}</strong>.
                <br />
                El proyecto seguirá existiendo, pero la sección de medición quedará vacía.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingMedicion}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleConfirmDeleteMedicion}
                disabled={isDeletingMedicion}
              >
                {isDeletingMedicion ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Sí, eliminar medición
                  </span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert para confirmar "Eliminar proyecto" */}
        <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Marcar proyecto como no realizado?</AlertDialogTitle>
              <AlertDialogDescription>
                Esto marcará el proyecto <strong>{proyecto.numeroOrden}</strong> como{" "}
                <strong>Rechazado</strong> y moverá la cotización asociada a{" "}
                <strong>&quot;Proyectos no realizados&quot;</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingProject}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleEliminarProyecto}
                disabled={isDeletingProject || isLoadingEtapas}
              >
                {isDeletingProject ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Sí, marcar como no realizado
                  </span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Alert para botón "Finalizado" → elegir a dónde pasa */}
        <AlertDialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿A dónde querés pasar la orden?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción cambiará el estado del proyecto <strong>{proyecto.numeroOrden}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2 py-2">
              <p className="text-xs text-muted-foreground">Seleccioná la siguiente etapa del flujo:</p>
              <div className="flex flex-wrap gap-2">
                {NEXT_ESTADOS.map((estado) => {
                  const isActive = selectedNextEstado === estado;
                  return (
                    <Button
                      key={estado}
                      type="button"
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className={
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 text-muted-foreground"
                      }
                      onClick={() => setSelectedNextEstado(estado)}
                      disabled={isMovingEstado}
                    >
                      {estado}
                    </Button>
                  );
                })}
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isMovingEstado} onClick={() => setSelectedNextEstado(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmMoveEstado} disabled={isMovingEstado || !selectedNextEstado}>
                {isMovingEstado ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Moviendo...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmar
                  </span>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Datos generales</h3>
            <p className="text-xs text-muted-foreground">Información básica del proyecto y su estado.</p>
            <div className="flex flex-wrap gap-2">
              <Badge className={getProgresoBadgeColor(proyectoExtras.progresoEstado ?? null)}>
                Progreso: {proyectoExtras.progresoEstado || "No iniciado"}
              </Badge>
              <Badge className="bg-muted text-muted-foreground">
                Prioridad: {proyectoExtras.prioridad || "—"}
              </Badge>
            </div>
          </div>
          <Badge className={getEstadoBadgeColor(proyecto.estadoActual)}>{estadoLabel}</Badge>
        </div>

        {/* DATOS GENERALES */}
        <section className="space-y-3 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">N° Orden</p>
              <p className="font-medium">{proyecto.numeroOrden}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Cliente</p>
              <p className="font-medium">{cliente?.nombreCompleto || "Sin nombre"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Técnico</p>
              <p className="font-medium">
                {typeof md?.asignadoA === "string" ? md.asignadoA : md?.asignadoA?.name || "Sin asignar"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">N° de orden de medición</p>
              <p className="font-medium">{md?.numeroOrdenMedicion || proyecto.numeroOrden || "-"}</p>
            </div>
          </div>
        </section>

        <Separator className="my-6" />

        {/* MEDICIÓN / DIRECCIÓN */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Datos de la medición</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Fecha de medición</p>
              <p className="font-medium">{fechaMedicion}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Tipo de abertura medida</p>
              <p className="font-medium">{md?.tipoAberturaMedida || "-"}</p>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <p className="text-muted-foreground text-xs">Dirección de obra</p>
              <p className="font-medium">{md?.direccionObra || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Cliente / Obra / Empresa</p>
              <p className="font-medium">{md?.clienteObraEmpresa || cliente?.nombreCompleto || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Cantidad de aberturas medidas</p>
              <p className="font-medium">{md?.cantidadAberturasMedidas || medidas.length || "-"}</p>
            </div>
          </div>
        </section>

        <Separator className="my-6" />

        {/* MEDIDAS TOMADAS */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Medidas tomadas</h3>
          <p className="text-xs text-muted-foreground">
            Cada fila corresponde a una abertura medida.
          </p>

          {medidas.length ? (
            <div className="space-y-2">
              {medidas.map((m, idx) => (
                <div
                  key={idx}
                  className="border rounded-md px-3 py-2 flex flex-wrap gap-3 bg-muted/40"
                >
                  <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                  <span>Alto: {m.alto ?? "-"}</span>
                  <span>Ancho: {m.ancho ?? "-"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin medidas cargadas.</p>
          )}

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Tolerancias o ajustes recomendados</p>
            <p className="font-medium whitespace-pre-line">{md?.toleranciasRecomendadas || "-"}</p>
          </div>
        </section>

        <Separator className="my-6" />

        {/* CONDICIÓN DE VANOS / ESTADO OBRA */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Condición de vanos y estado de la obra</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Condición de los vanos</p>
              {condicionVanos.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {condicionVanos.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-medium">-</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Estado de la obra al medir</p>
              <p className="font-medium">{md?.estadoObraMedicion || "-"}</p>
            </div>
          </div>
        </section>

        <Separator className="my-6" />

        {/* CONFIGURACIÓN DE CARPINTERÍA / VIDRIO */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Configuración de carpintería y vidrio</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Tipo de perfil previsto</p>
              <p className="font-medium">{md?.tipoPerfilPrevisto || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Color</p>
              <p className="font-medium">{md?.color || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Tipo de vidrio solicitado</p>
              <p className="font-medium">{md?.tipoVidrioSolicitado || "-"}</p>
            </div>
          </div>
        </section>

        <Separator className="my-6" />

        {/* PLANOS / FOTOS */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Documentación gráfica</h3>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Referencia del plano o croquis</p>
            {planos.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {planos.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-[4/3] overflow-hidden rounded-md border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Plano / croquis"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin planos/croquis adjuntos.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Fotos de medición</p>
            {fotos.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fotos.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-[4/3] overflow-hidden rounded-md border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt="Foto de medición"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sin fotos de medición.</p>
            )}
          </div>
        </section>

        <Separator className="my-6" />

        {/* OBSERVACIONES / FIRMA / ESTADOS */}
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Cierre de medición</h3>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Observaciones técnicas</p>
            <p className="font-medium whitespace-pre-line">{md?.observacionesMedicion || "Sin observaciones."}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Estado final</p>
            <p className="font-medium">{md?.estadoFinalMedicion || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Enviar a verificación</p>
            <p className="font-medium">{md?.enviarAVerificacion || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Firma del técnico</p>
            {md?.firmaValidacionTecnico ? (
              <div className="inline-flex items-center justify-center rounded-md border bg-muted px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={md.firmaValidacionTecnico}
                  alt="Firma de validación"
                  className="max-h-24 object-contain"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay firma cargada.</p>
            )}
          </div>
        </section>
      </div>

      {/* 👉 BOTONES DE ACCIÓN ABAJO (fuera del área PDF si querés que no aparezcan) */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Acciones sobre el proyecto</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="inline-flex items-center gap-1"
            onClick={() => {
              setSelectedNextEstado(null);
              setMoveDialogOpen(true);
            }}
            disabled={isMovingEstado}
          >
            <CheckCircle2 className="h-3 w-3" />
            Finalizar
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1 border-amber-500/60 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
            onClick={handleTerminarProyecto}
            disabled={isTerminatingProject || isLoadingEtapas}
          >
            {isTerminatingProject ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Terminando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                Terminar proyecto
              </>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="inline-flex items-center gap-1 border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteProjectOpen(true)}
            disabled={isDeletingProject || isLoadingEtapas}
          >
            <XCircle className="h-3 w-3" />
            Eliminar proyecto
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1 border-slate-400/60 text-slate-600 hover:bg-slate-100"
            onClick={() => setDeleteMedicionOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
            Eliminar medición
          </Button>
        </div>
      </section>
    </div>
  );
}