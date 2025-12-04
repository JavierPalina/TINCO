// /components/proyectos/VerificacionView.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { IProyecto } from "@/models/Proyecto";
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
  proyecto: IProyecto;
  onDeleted?: () => void;
};

type EtapaCotizacion = {
  _id: string;
  nombre: string;
  color: string;
};

const NEXT_ESTADOS: string[] = [
  "Taller",
  "Depósito",
  "Logística",
  "Completado",
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

// ---- Tipos auxiliares para evitar any ---- //

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

type UsuarioVerifico =
  | {
      name?: string | null;
      nombre?: string | null;
    }
  | string
  | null
  | undefined;

type VerificacionData = {
  clienteObraEmpresa?: string;
  direccionObra?: string;
  usuarioVerifico?: UsuarioVerifico;
  fechaRevisionPlano?: string | Date | null;
  fechaVerificacionCompleta?: string | Date | null;
  archivosPlanosCroquis?: string[];

  medidasVerificadas?: string;
  medidasVerificadasObservaciones?: string;
  fuenteMedidas?: string;
  planosRevisados?: string;

  materialesDisponiblesEstado?: string;
  listaMaterialesRevisada?: string;
  accesoriosCompletosEstado?: string;
  vidriosDisponiblesEstado?: string;

  materialesFaltantesDetalle?: string;
  materialesProveedorPendiente?: string;
  accesoriosFaltantesDetalle?: string;

  tipoMaterial?: string;
  tipoPerfilVerificado?: string;
  proveedorPerfil?: string;
  estadoPerfiles?: string;
  compatibilidadHerrajes?: string;
  medidasVidriosConfirmadas?: string;

  color?: string;
  estadoColor?: string;

  estadoGeneralVerificacion?: string;
  aprobadoParaProduccion?: string;
  observacionesVerificacion?: string;
};

type ClienteData = {
  nombreCompleto?: string | null;
};

type VisitaTecnicaData = {
  direccion?: string | null;
};

// Obtiene el ObjectId de la cotización desde el proyecto
const getCotizacionIdFromProyecto = (
  proyecto: ProyectoConCotizacion | null | undefined,
): string | null => {
  if (!proyecto?.cotizacion) return null;

  const cotizacion = proyecto.cotizacion;

  if (typeof cotizacion === "string") return cotizacion;

  const id = cotizacion._id;
  if (!id) return null;

  return typeof id === "string" ? id : id.toString();
};

export function VerificacionView({ proyecto, onDeleted }: Props) {
  const [deleteVerificacionOpen, setDeleteVerificacionOpen] = useState(false);
  const [isDeletingVerificacion, setIsDeletingVerificacion] = useState(false);

  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [isTerminatingProject, setIsTerminatingProject] = useState(false);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedNextEstado, setSelectedNextEstado] = useState<string | null>(
    null,
  );
  const [isMovingEstado, setIsMovingEstado] = useState(false);

  const v = (proyecto.verificacion ?? {}) as VerificacionData;
  const cliente = (proyecto.cliente ?? {}) as ClienteData;
  const vt = (proyecto.visitaTecnica ?? {}) as VisitaTecnicaData;

  const archivos: string[] = Array.isArray(v.archivosPlanosCroquis)
    ? v.archivosPlanosCroquis
    : [];

  const fechaRevisionPlano =
    v.fechaRevisionPlano &&
    !Number.isNaN(new Date(v.fechaRevisionPlano).getTime())
      ? new Date(v.fechaRevisionPlano).toLocaleDateString()
      : "-";

  const fechaVerificacionCompleta =
    v.fechaVerificacionCompleta &&
    !Number.isNaN(new Date(v.fechaVerificacionCompleta).getTime())
      ? new Date(v.fechaVerificacionCompleta).toLocaleDateString()
      : "-";

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

  // 🔴 Eliminar SOLO la verificación
  const handleConfirmDeleteVerificacion = async () => {
    try {
      setIsDeletingVerificacion(true);

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        datosFormulario: {
          verificacion: {},
        },
      });

      toast.success("Verificación eliminada correctamente");
      setDeleteVerificacionOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        toast.error(
          "Error al eliminar la verificación: " +
            ((error.response?.data as { error?: string } | undefined)?.error || error.message),
        );
      } else {
        toast.error(
          "Error al eliminar la verificación: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsDeletingVerificacion(false);
    }
  };

  // 🟡 Eliminar proyecto
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
        toast.error(
          "Error al eliminar el proyecto: " +
            ((error.response?.data as { error?: string } | undefined)?.error ??
              error.message),
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

  // ✅ Terminar proyecto
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
        toast.error(
          "Error al terminar el proyecto: " +
            ((error.response?.data as { error?: string } | undefined)?.error ??
              error.message),
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

  // 🟢 Botón "Finalizar" → cambio de estado manual
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
        toast.error(
          "Error al mover el proyecto: " +
            ((error.response?.data as { error?: string } | undefined)?.error ??
            error.message),
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

  const usuarioVerificoNombre =
    (typeof v.usuarioVerifico === "string"
      ? v.usuarioVerifico
      : v.usuarioVerifico?.name || v.usuarioVerifico?.nombre) ?? "—";

  const direccionObra = v.direccionObra || vt.direccion || "—";

  return (
    <div className="space-y-8 text-sm">
      {/* Alert: Eliminar verificación */}
      <AlertDialog
        open={deleteVerificacionOpen}
        onOpenChange={setDeleteVerificacionOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar datos de verificación?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los datos de la etapa de verificación
              del proyecto <strong>{proyecto.numeroOrden}</strong>.
              <br />
              El proyecto seguirá existiendo, pero la sección de verificación
              quedará vacía.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingVerificacion}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDeleteVerificacion}
              disabled={isDeletingVerificacion}
            >
              {isDeletingVerificacion ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Sí, eliminar verificación
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert: Eliminar proyecto */}
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
              <strong>Rechazado</strong> y moverá la cotización asociada a{" "}
              <strong>&quot;Proyectos no realizados&quot;</strong> en el
              pipeline de cotizaciones. Luego el proyecto se eliminará de la
              base de datos.
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

      {/* Alert: Finalizar → seleccionar estado destino */}
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
          <h3 className="text-lg font-semibold">
            Verificación – {proyecto.numeroOrden}
          </h3>
          <p className="text-xs text-muted-foreground">
            Resumen de verificación de medidas, materiales y perfiles antes de
            pasar a taller.
          </p>
        </div>
        <Badge className={getEstadoBadgeColor(proyecto.estadoActual)}>
          {proyecto.estadoActual}
        </Badge>
      </div>

      {/* Datos generales */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Datos generales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">N° Orden</p>
            <p className="font-medium">{proyecto.numeroOrden}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium">
              {v.clienteObraEmpresa || cliente?.nombreCompleto || "Sin nombre"}
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Dirección de la obra</p>
            <p className="font-medium">{direccionObra}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Usuario que verificó
            </p>
            <p className="font-medium">{usuarioVerificoNombre}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Fecha verificación completa
            </p>
            <p className="font-medium">{fechaVerificacionCompleta}</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Medidas y planos */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Medidas y planos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Medidas verificadas</p>
            <p className="font-medium">
              {v.medidasVerificadas || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Fuente de medidas</p>
            <p className="font-medium">
              {v.fuenteMedidas || "No especificada"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Planos revisados</p>
            <p className="font-medium">
              {v.planosRevisados || "No especificado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Fecha revisión de plano
            </p>
            <p className="font-medium">{fechaRevisionPlano}</p>
          </div>
        </div>

        {v.medidasVerificadas === "Observaciones" &&
          v.medidasVerificadasObservaciones && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Observaciones sobre las medidas
              </p>
              <p className="font-medium whitespace-pre-line">
                {v.medidasVerificadasObservaciones}
              </p>
            </div>
          )}
      </section>

      <Separator />

      {/* Materiales, lista y accesorios */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">
          Materiales, lista y accesorios
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Materiales disponibles
            </p>
            <p className="font-medium">
              {v.materialesDisponiblesEstado || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Lista de materiales revisada
            </p>
            <p className="font-medium">
              {v.listaMaterialesRevisada || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Accesorios completos</p>
            <p className="font-medium">
              {v.accesoriosCompletosEstado || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Vidrios disponibles
            </p>
            <p className="font-medium">
              {v.vidriosDisponiblesEstado || "No indicado"}
            </p>
          </div>
        </div>

        {v.materialesFaltantesDetalle && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Detalle de materiales faltantes
            </p>
            <p className="font-medium whitespace-pre-line">
              {v.materialesFaltantesDetalle}
            </p>
          </div>
        )}

        {v.materialesProveedorPendiente && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Materiales pendientes de ingreso – proveedor
            </p>
            <p className="font-medium whitespace-pre-line">
              {v.materialesProveedorPendiente}
            </p>
          </div>
        )}

        {v.accesoriosFaltantesDetalle && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Detalle de accesorios faltantes
            </p>
            <p className="font-medium whitespace-pre-line">
              {v.accesoriosFaltantesDetalle}
            </p>
          </div>
        )}
      </section>

      <Separator />

      {/* Perfiles, material y color */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Perfiles, material y color</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tipo de material</p>
            <p className="font-medium">{v.tipoMaterial || "No indicado"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Tipo de perfil verificado
            </p>
            <p className="font-medium">
              {v.tipoPerfilVerificado || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Proveedor de perfil
            </p>
            <p className="font-medium">
              {v.proveedorPerfil || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Estado de los perfiles
            </p>
            <p className="font-medium">
              {v.estadoPerfiles || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Compatibilidad con herrajes
            </p>
            <p className="font-medium">
              {v.compatibilidadHerrajes || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Medidas de vidrios confirmadas
            </p>
            <p className="font-medium">
              {v.medidasVidriosConfirmadas || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Color</p>
            <p className="font-medium">{v.color || "No indicado"}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Estado de color</p>
            <p className="font-medium">
              {v.estadoColor || "No indicado"}
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Archivos */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Archivos de planos / croquis</h3>
        {archivos.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {archivos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-between rounded-md border px-3 py-2 text-xs hover:bg-muted/60"
              >
                <span className="truncate">{url}</span>
                <span className="ml-2 text-[10px] text-muted-foreground group-hover:underline">
                  Abrir
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No hay archivos adjuntos en esta etapa.
          </p>
        )}
      </section>

      <Separator />

      {/* Observaciones y estado general */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">
          Resultado de la verificación
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Estado general de la verificación
            </p>
            <p className="font-medium">
              {v.estadoGeneralVerificacion || "No indicado"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Aprobado para producción
            </p>
            <p className="font-medium">
              {v.aprobadoParaProduccion || "No indicado"}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Observaciones de verificación
          </p>
          <p className="font-medium whitespace-pre-line">
            {v.observacionesVerificacion || "Sin observaciones."}
          </p>
        </div>
      </section>

      <Separator />

      {/* Acciones */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Acciones sobre el proyecto
        </h3>
        <div className="flex flex-wrap gap-2">
          {/* Finalizar → elegir estado destino */}
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

          {/* Eliminar solo verificación */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1 border-slate-400/60 text-slate-600 hover:bg-slate-100"
            onClick={() => setDeleteVerificacionOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
            Eliminar verificación
          </Button>
        </div>
      </section>
    </div>
  );
}
