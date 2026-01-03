// /components/proyectos/VisitaTecnicaView.tsx
"use client";

import { useState } from "react";
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
import { Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

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

// estados a los que se puede pasar con el botón "Finalizado"
const NEXT_ESTADOS: string[] = [
  "Medición",
  "Verificación",
  "Taller",
  "Depósito",
  "Logística",
];

const getEstadoBadgeColor = (estado: string) => {
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

/* ------------ Tipos auxiliares para eliminar any ------------ */

type CotizacionRef =
  | string
  | {
      _id?: string | { toString(): string } | null;
    }
  | null
  | undefined;

interface ProyectoConCotizacion {
  cotizacion?: CotizacionRef;
}

type AsignadoARef =
  | string
  | {
      name?: string | null;
    }
  | null
  | undefined;

type MedidaTomada = Partial<{
  alto: string | number | null;
  ancho: string | number | null;
  profundidad: string | number | null;
  largo: string | number | null;
  cantidad: string | number | null;
}>;

type VisitaTecnicaData = {
  asignadoA?: AsignadoARef;
  tipoVisita?: string | null;

  fechaVisita?: string | Date | null;
  horaVisita?: string | null;

  direccion?: string | null;
  entrecalles?: string | null;
  otraInfoDireccion?: string | null;

  estadoObra?: string | null;
  condicionVanos?: string[];

  medidasTomadas?: MedidaTomada[];
  tipoAberturaMedida?: string | null;

  materialSolicitado?: string | null;
  color?: string | null;
  vidriosConfirmados?: string | null;
  estadoTareaVisita?: string | null;
  recomendacionTecnica?: string | null;
  observacionesTecnicas?: string | null;

  planosAdjuntos?: string[];
  fotosObra?: string[];
  firmaVerificacion?: string | null;
};

type ClienteData = {
  nombreCompleto?: string | null;
};

/**
 * Obtiene el ObjectId de la cotización asociada al proyecto,
 * ya sea que venga populado o como string suelto.
 */
const getCotizacionIdFromProyecto = (
  proyecto: ProyectoConCotizacion | null | undefined,
): string | null => {
  if (!proyecto?.cotizacion) return null;

  const cotizacion = proyecto.cotizacion;

  if (typeof cotizacion === "string") {
    return cotizacion;
  }

  const id = cotizacion._id;
  if (!id) return null;

  return typeof id === "string" ? id : id.toString();
};

export function VisitaTecnicaView({ proyecto, onDeleted }: Props) {
  // Eliminar SOLO la visita técnica
  const [deleteVisitOpen, setDeleteVisitOpen] = useState(false);
  const [isDeletingVisit, setIsDeletingVisit] = useState(false);

  // Eliminar / rechazar proyecto
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  // Terminar proyecto
  const [isTerminatingProject, setIsTerminatingProject] = useState(false);

  // Dialog para "Finalizado" → elegir próximo estado
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedNextEstado, setSelectedNextEstado] = useState<string | null>(
    null,
  );
  const [isMovingEstado, setIsMovingEstado] = useState(false);

  const vt = (proyecto.visitaTecnica ?? {}) as VisitaTecnicaData;
  const cliente = (proyecto.cliente ?? {}) as ClienteData;

  const medidas: MedidaTomada[] = Array.isArray(vt.medidasTomadas)
    ? vt.medidasTomadas
    : [];
  const condicionVanos: string[] = Array.isArray(vt.condicionVanos)
    ? vt.condicionVanos
    : [];
  const planos: string[] = Array.isArray(vt.planosAdjuntos)
    ? vt.planosAdjuntos
    : [];
  const fotos: string[] = Array.isArray(vt.fotosObra) ? vt.fotosObra : [];

  const fechaVisita =
    vt?.fechaVisita && !Number.isNaN(new Date(vt.fechaVisita).getTime())
      ? new Date(vt.fechaVisita).toLocaleDateString()
      : "-";

  // Traemos etapas de cotización
  const { data: etapasCotizacion, isLoading: isLoadingEtapas } = useQuery<
    EtapaCotizacion[]
  >({
    queryKey: ["etapasCotizacion"],
    queryFn: async () => {
      const { data } = await axios.get("/api/etapas-cotizacion");
      return data.data as EtapaCotizacion[];
    },
  });

  const findEtapaIdByNombre = (nombre: string): string | null => {
    if (!etapasCotizacion) return null;
    const etapa = etapasCotizacion.find((e) => e.nombre === nombre);
    return etapa?._id ?? null;
  };

  /**
   * Mueve la cotización asociada al proyecto a una etapa del pipeline
   * según su nombre ("Proyecto Finalizado", "Proyectos no realizados", etc.).
   */
  const moveCotizacionToEtapa = async (nombreEtapa: string) => {
    const cotizacionId = getCotizacionIdFromProyecto(proyecto);
    if (!cotizacionId) {
      toast.error("Este proyecto no tiene una cotización asociada.");
      return;
    }

    const etapaId = findEtapaIdByNombre(nombreEtapa);
    if (!etapaId) {
      toast.error(
        `No se encontró la etapa "${nombreEtapa}" en el pipeline de cotizaciones.`,
      );
      return;
    }

    await axios.put(`/api/cotizaciones/${cotizacionId}`, {
      etapa: etapaId,
    });
  };

  // 🔴 Eliminar SOLO la visita técnica
  const handleConfirmDeleteVisit = async () => {
    try {
      setIsDeletingVisit(true);

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        datosFormulario: {
          visitaTecnica: {},
        },
      });

      toast.success("Visita técnica eliminada correctamente");
      setDeleteVisitOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(
          "Error al eliminar la visita técnica: " +
            (apiError?.error ?? error.message),
        );
      } else {
        toast.error(
          "Error al eliminar la visita técnica: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsDeletingVisit(false);
    }
  };

  // 🟡 "Eliminar proyecto" → pipeline a "Proyectos no realizados" + Proyecto.estadoActual = "Rechazado"
  const handleEliminarProyecto = async () => {
    try {
      setIsDeletingProject(true);

      // 1) Mover la cotización en el pipeline
      await moveCotizacionToEtapa("Proyectos no realizados");

      // 2) Marcar el proyecto como Rechazado
      await axios.put(`/api/proyectos/${proyecto._id}`, {
        estadoActual: "Rechazado",
      });

      // 3) Eliminar el proyecto de la base de datos
      await axios.delete(`/api/proyectos/${proyecto._id}`);

      toast.success(
        "Proyecto eliminado y cotización movida a 'Proyectos no realizados' en el pipeline.",
      );
      setDeleteProjectOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(
          "Error al eliminar el proyecto: " +
            (apiError?.error ?? error.message),
        );
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

  // ✅ "Terminar proyecto" → pipeline a "Proyecto Finalizado" + Proyecto.estadoActual = "Completado"
  const handleTerminarProyecto = async () => {
    try {
      setIsTerminatingProject(true);

      // 1) Mover la cotización en el pipeline
      await moveCotizacionToEtapa("Proyecto Finalizado");

      // 2) Marcar el proyecto como Completado
      await axios.put(`/api/proyectos/${proyecto._id}`, {
        estadoActual: "Completado",
      });

      toast.success(
        "Proyecto completado y cotización movida a 'Proyecto Finalizado' en el pipeline.",
      );
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(
          "Error al terminar el proyecto: " +
            (apiError?.error ?? error.message),
        );
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

  // 🟢 Confirmar movimiento con botón "Finalizado"
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
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(
          "Error al mover el proyecto: " +
            (apiError?.error ?? error.message),
        );
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

  const asignadoANombre =
    (typeof vt.asignadoA === "string"
      ? vt.asignadoA
      : vt.asignadoA?.name) ?? "Sin asignar";

  return (
    <div className="space-y-8 text-sm">
      {/* Alert para confirmar eliminación de VISITA TÉCNICA */}
      <AlertDialog open={deleteVisitOpen} onOpenChange={setDeleteVisitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar datos de la visita técnica?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los datos cargados en la visita
              técnica del proyecto{" "}
              <strong>{proyecto.numeroOrden}</strong>.
              <br />
              El proyecto seguirá existiendo, pero la sección de visita técnica
              quedará vacía.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingVisit}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDeleteVisit}
              disabled={isDeletingVisit}
            >
              {isDeletingVisit ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Sí, eliminar visita
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert para confirmar "Eliminar proyecto" */}
      <AlertDialog
        open={deleteProjectOpen}
        onOpenChange={setDeleteProjectOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Marcar proyecto como no realizado?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esto marcará el proyecto{" "}
              <strong>{proyecto.numeroOrden}</strong> como{" "}
              <strong>Rechazado</strong> y moverá la cotización asociada a la
              etapa <strong>&quot;Proyectos no realizados&quot;</strong> en el
              pipeline de cotizaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProject}>
              Cancelar
            </AlertDialogCancel>
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
              Esta acción cambiará el estado del proyecto{" "}
              <strong>{proyecto.numeroOrden}</strong> a la etapa seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              Seleccioná la siguiente etapa del flujo:
            </p>
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
            <AlertDialogCancel
              disabled={isMovingEstado}
              onClick={() => setSelectedNextEstado(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmMoveEstado}
              disabled={isMovingEstado || !selectedNextEstado}
            >
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
          <p className="text-xs text-muted-foreground">
            Información básica del proyecto y su estado actual.
          </p>
        </div>
        <Badge className={getEstadoBadgeColor(proyecto.estadoActual)}>
          {proyecto.estadoActual}
        </Badge>
      </div>

      {/* DATOS GENERALES */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">N° Orden</p>
            <p className="font-medium">{proyecto.numeroOrden}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Cliente</p>
            <p className="font-medium">
              {cliente?.nombreCompleto || "Sin nombre"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Técnico asignado</p>
            <p className="font-medium">{asignadoANombre}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Tipo de visita</p>
            <p className="font-medium">{vt?.tipoVisita || "-"}</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* VISITA TÉCNICA / DIRECCIÓN */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Visita técnica</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Fecha de visita</p>
            <p className="font-medium">{fechaVisita}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Hora de visita</p>
            <p className="font-medium">{vt?.horaVisita || "-"}</p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <p className="text-muted-foreground text-xs">Dirección</p>
            <p className="font-medium">{vt?.direccion || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Entrecalles</p>
            <p className="font-medium">{vt?.entrecalles || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">
              Información adicional
            </p>
            <p className="font-medium whitespace-pre-line">
              {vt?.otraInfoDireccion || "-"}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ESTADO DE OBRA / VANOS */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Estado de la obra y vanos</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Estado de la obra</p>
            <p className="font-medium">{vt?.estadoObra || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Condición de vanos</p>
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
        </div>
      </section>

      <Separator />

      {/* MEDIDAS TOMADAS */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Medidas tomadas</h3>
        <p className="text-xs text-muted-foreground">
          Cada fila corresponde a un vano o elemento medido.
        </p>

        {medidas.length ? (
          <div className="space-y-2">
            {medidas.map((m, idx) => (
              <div
                key={idx}
                className="border rounded-md px-3 py-2 flex flex-wrap gap-3 bg-muted/40"
              >
                <span className="text-xs text-muted-foreground">
                  #{idx + 1}
                </span>
                <span>Alto: {m.alto ?? "-"}</span>
                <span>Ancho: {m.ancho ?? "-"}</span>
                <span>Profundidad: {m.profundidad ?? "-"}</span>
                <span>Largo: {m.largo ?? "-"}</span>
                <span>Cantidad: {m.cantidad ?? "-"}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sin medidas cargadas.</p>
        )}

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">
            Tipo de abertura medida
          </p>
          <p className="font-medium">{vt?.tipoAberturaMedida || "-"}</p>
        </div>
      </section>

      <Separator />

      {/* CONFIGURACIÓN TÉCNICA / ESTADOS */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Configuración técnica</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Material solicitado</p>
            <p className="font-medium">{vt?.materialSolicitado || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Color</p>
            <p className="font-medium">{vt?.color || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">
              Vidrios confirmados
            </p>
            <p className="font-medium">{vt?.vidriosConfirmados || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">
              Estado tarea visita
            </p>
            <p className="font-medium">{vt?.estadoTareaVisita || "-"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">
              Recomendación técnica
            </p>
            <p className="font-medium">{vt?.recomendacionTecnica || "-"}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">
            Observaciones técnicas
          </p>
          <p className="font-medium whitespace-pre-line">
            {vt?.observacionesTecnicas || "Sin observaciones."}
          </p>
        </div>
      </section>

      <Separator />

      {/* PLANOS / FOTOS */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Documentación gráfica</h3>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Planos / croquis</p>
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
                    alt="Plano"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin planos adjuntos.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Fotos de obra</p>
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
                    alt="Foto de obra"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Sin fotos adjuntas.
            </p>
          )}
        </div>
      </section>

      <Separator />

      {/* FIRMA */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Verificación</h3>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Firma digital</p>
          {vt?.firmaVerificacion ? (
            <div className="inline-flex items-center justify-center rounded-md border bg-muted px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={vt.firmaVerificacion}
                alt="Firma de verificación"
                className="max-h-24 object-contain"
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No hay firma de verificación cargada.
            </p>
          )}
        </div>
      </section>

      <Separator />

      {/* 👉 BOTONES DE ACCIÓN ABAJO */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Acciones sobre el proyecto
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Botón FINALIZADO → abre diálogo para elegir siguiente etapa */}
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

          {/* Terminar proyecto (Proyecto Finalizado + Completado) */}
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

          {/* Eliminar proyecto / no realizado */}
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

          {/* Eliminar solo visita técnica */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1 border-slate-400/60 text-slate-600 hover:bg-slate-100"
            onClick={() => setDeleteVisitOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
            Eliminar visita
          </Button>
        </div>
      </section>
    </div>
  );
}
