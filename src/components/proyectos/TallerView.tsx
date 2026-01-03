"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { ProyectoDTO } from "@/types/proyecto";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  /** Opcional: para avisarle al padre que cambió algo y refrescar */
  onDeleted?: () => void;
};

type TallerDataView = {
  numeroOrdenTaller?: number | string;
  clienteObraEmpresa?: string;

  fechaIngresoTaller?: string | Date;
  horaIngresoTaller?: string;

  asignadoA?: { name?: string } | string;

  tipoAbertura?: string;
  materialPerfil?: string;
  tipoPerfil?: string;
  tipoPerfilOtro?: string;

  color?: string;
  vidrioAColocar?: string;

  accesoriosCompletos?: string;
  materialDisponible?: string;
  detalleMaterial?: string;

  medidasVerificadas?: string;
  planosVerificados?: string;

  estadoTaller?: string;
  fechaEstimadaFinalizacion?: string | Date;

  informeTaller?: string;

  evidenciasTaller?: string[];

  controlCalidadRealizadoPor?: { name?: string } | string;
  fechaControlCalidad?: string | Date;

  pedidoListoEntrega?: string;
  derivarA?: string;
};

type EtapaCotizacion = {
  _id: string;
  nombre: string;
  color: string;
};

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

// Estados a los que se puede mover el proyecto con el botón "Finalizar"
const NEXT_ESTADOS: string[] = [
  "Medición",
  "Verificación",
  "Taller",
  "Depósito",
  "Logística",
];

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

export function TallerView({ proyecto, onDeleted }: Props) {
  const taller = (proyecto.taller || {}) as TallerDataView;

  const fmtDate = (d?: string | Date) => {
    if (!d) return "";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-AR");
  };

  const fmtDateTime = (d?: string | Date, h?: string) => {
    const fecha = fmtDate(d);
    if (!fecha && !h) return "";
    if (fecha && h) return `${fecha} ${h}`;
    return fecha || h || "";
  };

  const tecnicoNombre =
    typeof taller.asignadoA === "string"
      ? taller.asignadoA
      : taller.asignadoA?.name || "—";

  const controlCalidadNombre =
    typeof taller.controlCalidadRealizadoPor === "string"
      ? taller.controlCalidadRealizadoPor
      : taller.controlCalidadRealizadoPor?.name || "—";

  // --- Estados de UI para acciones ---
  const [deleteTallerOpen, setDeleteTallerOpen] = useState(false);
  const [isDeletingTaller, setIsDeletingTaller] = useState(false);

  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [isTerminatingProject, setIsTerminatingProject] = useState(false);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedNextEstado, setSelectedNextEstado] = useState<string | null>(
    null,
  );
  const [isMovingEstado, setIsMovingEstado] = useState(false);

  // Etapas de cotización para mover en el pipeline
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

  // 🔴 Eliminar SOLO Taller (vacía el objeto taller del proyecto)
  const handleConfirmDeleteTaller = async () => {
    try {
      setIsDeletingTaller(true);

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        datosFormulario: {
          taller: {},
        },
      });

      toast.success("Datos de taller eliminados correctamente.");
      setDeleteTallerOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(
          "Error al eliminar los datos de taller: " +
            (apiError?.error ?? error.message),
        );
      } else {
        toast.error(
          "Error al eliminar los datos de taller: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsDeletingTaller(false);
    }
  };

  // 🟡 Eliminar proyecto completo
  const handleEliminarProyecto = async () => {
    try {
      setIsDeletingProject(true);

      // 1) Mover la cotización en el pipeline
      await moveCotizacionToEtapa("Proyectos no realizados");

      // 2) Marcar el proyecto como Rechazado
      await axios.put(`/api/proyectos/${proyecto._id}`, {
        estadoActual: "Rechazado",
      });

      // 3) Eliminar el proyecto de la base
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

  // ✅ Terminar proyecto → "Proyecto Finalizado" + estadoActual = Completado
  const handleTerminarProyecto = async () => {
    try {
      setIsTerminatingProject(true);

      await moveCotizacionToEtapa("Proyecto Finalizado");

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

  // 🟢 "Finalizar" → elegir próxima etapa (cambia estadoActual)
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

  return (
    <div className="space-y-4 text-sm">
      {/* Alert: eliminar solo TALLER */}
      <AlertDialog open={deleteTallerOpen} onOpenChange={setDeleteTallerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar datos de taller?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los datos cargados en{" "}
              <strong>Taller</strong> del proyecto{" "}
              <strong>{proyecto.numeroOrden}</strong>.
              <br />
              El proyecto seguirá existiendo, pero la sección de taller quedará
              vacía.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingTaller}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDeleteTaller}
              disabled={isDeletingTaller}
            >
              {isDeletingTaller ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Sí, eliminar taller
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert: eliminar proyecto */}
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

      {/* Alert: seleccionar siguiente etapa para "Finalizar" */}
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

      <Card>
        <CardHeader>
          <CardTitle>
            Taller – Orden {taller.numeroOrdenTaller ?? proyecto.numeroOrden}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          {/* Identificación */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Cliente / Obra / Empresa
              </p>
              <p>{taller.clienteObraEmpresa || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Ingreso al taller
              </p>
              <p>
                {fmtDateTime(
                  taller.fechaIngresoTaller,
                  taller.horaIngresoTaller,
                ) || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Técnico de taller
              </p>
              <p>{tecnicoNombre}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Estado de Taller
              </p>
              <p>{taller.estadoTaller || "—"}</p>
            </div>
          </section>

          {/* Configuración de abertura */}
          <section className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tipo de abertura
              </p>
              <p>{taller.tipoAbertura || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Material de perfil
              </p>
              <p>{taller.materialPerfil || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tipo de perfil
              </p>
              <p>
                {taller.tipoPerfilOtro
                  ? taller.tipoPerfilOtro
                  : taller.tipoPerfil || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Color
              </p>
              <p>{taller.color || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Vidrio a colocar
              </p>
              <p>{taller.vidrioAColocar || "—"}</p>
            </div>
          </section>

          {/* Materiales / verificaciones */}
          <section className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Accesorios completos
              </p>
              <p>{taller.accesoriosCompletos || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Material disponible
              </p>
              <p>{taller.materialDisponible || "—"}</p>
              {taller.detalleMaterial && (
                <p className="text-xs text-muted-foreground">
                  {taller.detalleMaterial}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Medidas verificadas
              </p>
              <p>{taller.medidasVerificadas || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Planos verificados
              </p>
              <p>{taller.planosVerificados || "—"}</p>
            </div>
          </section>

          {/* Fechas / estado */}
          <section className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Fecha estimada de finalización
              </p>
              <p>
                {fmtDate(taller.fechaEstimadaFinalizacion) ||
                  "No definida aún"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Control de calidad realizado por
              </p>
              <p>{controlCalidadNombre}</p>
              <p className="text-xs text-muted-foreground">
                {fmtDate(taller.fechaControlCalidad) || ""}
              </p>
            </div>
          </section>

          {/* Pedido listo / derivación */}
          <section className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pedido listo para entrega
              </p>
              <p>{taller.pedidoListoEntrega || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Derivado a
              </p>
              <p>{taller.derivarA || "—"}</p>
            </div>
          </section>

          {/* Informe */}
          <section className="border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Informe de Taller
            </p>
            <p className="whitespace-pre-wrap">
              {taller.informeTaller || "Sin informe registrado."}
            </p>
          </section>

          {/* Evidencias */}
          <section className="border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Evidencias de armado
            </p>
            {taller.evidenciasTaller && taller.evidenciasTaller.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {taller.evidenciasTaller.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs underline"
                  >
                    Ver archivo
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No hay evidencias cargadas.
              </p>
            )}
          </section>

          {/* 👉 Acciones sobre el proyecto */}
          <section className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Acciones sobre el proyecto
            </h3>
            <div className="flex flex-wrap gap-2">
              {/* Finalizar → elegir siguiente etapa */}
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

              {/* Terminar proyecto */}
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

              {/* Eliminar proyecto */}
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

              {/* Eliminar solo taller */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-1 border-slate-400/60 text-slate-600 hover:bg-slate-100"
                onClick={() => setDeleteTallerOpen(true)}
              >
                <Trash2 className="h-3 w-3" />
                Eliminar taller
              </Button>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
