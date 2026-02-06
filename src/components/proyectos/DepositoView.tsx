// ./src/components/proyectos/DepositoView.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { IProyecto } from "@/models/Proyecto";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { ProyectoDTO } from "@/types/proyecto";

type DepositoData = {
  numeroOrdenDeposito?: string;
  fechaIngresoDeposito?: string;
  responsableRecepcion?: string;

  origenPedido?: string;
  estadoProductoRecibido?: string;

  cantidadUnidades?: number | null;

  ubicacionSeleccion?: string;
  ubicacionDetalle?: string;

  verificacionEmbalaje?: string;

  identificacion?: string;

  materialAlmacenado?: string;
  materialAlmacenadoOtro?: string;

  controlMedidasOk?: boolean;
  cantidadPiezasControladas?: number | null;

  condicionVidrio?: string;

  fotosIngreso?: string[];

  fechaSalidaEntrega?: string;
  estadoActualPedido?: string;

  observacionesDeposito?: string;

  usuarioEncargado?: string;
};

interface DepositoViewProps {
  proyecto: ProyectoDTO;
  /** Opcional: para refrescar el padre cuando algo cambia */
  onDeleted?: () => void;
}

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

/** ✅ Evita any: extendemos el proyecto con el campo deposito */
type ProyectoConDeposito = IProyecto & {
  deposito?: DepositoData | null;
};

// Estados posibles a donde pasar con el botón "Finalizar"
const NEXT_ESTADOS: string[] = [
  "Medición",
  "Verificación",
  "Taller",
  "Depósito",
  "Logística",
];

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-AR");
}

function getEstadoBadgeColor(estado?: string) {
  switch (estado) {
    case "En depósito":
      return "bg-slate-600 hover:bg-slate-700";
    case "Listo para entrega":
      return "bg-emerald-600 hover:bg-emerald-700";
    case "En revisión":
      return "bg-amber-500 hover:bg-amber-600 text-black";
    case "Devolución":
      return "bg-red-500 hover:bg-red-600";
    default:
      return "bg-gray-400 hover:bg-gray-500";
  }
}

/**
 * Obtiene el ObjectId de la cotización asociada al proyecto,
 * ya sea que venga populado o como string.
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

export function DepositoView({ proyecto, onDeleted }: DepositoViewProps) {
  /** ✅ Sin any */
  const deposito = (proyecto as ProyectoConDeposito).deposito ?? undefined;

  // --- Estados de UI para acciones ---
  const [deleteDepositoOpen, setDeleteDepositoOpen] = useState(false);
  const [isDeletingDeposito, setIsDeletingDeposito] = useState(false);

  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const [isTerminatingProject, setIsTerminatingProject] = useState(false);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [selectedNextEstado, setSelectedNextEstado] = useState<string | null>(
    null,
  );
  const [isMovingEstado, setIsMovingEstado] = useState(false);

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

  // 🔴 Eliminar SOLO Depósito (deja vacía la sección deposito)
  const handleConfirmDeleteDeposito = async () => {
    try {
      setIsDeletingDeposito(true);

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        datosFormulario: {
          deposito: {},
        },
      });

      toast.success("Datos de depósito eliminados correctamente.");
      setDeleteDepositoOpen(false);
      onDeleted?.();
    } catch (error: unknown) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(
          "Error al eliminar los datos de depósito: " +
            (apiError?.error ?? error.message),
        );
      } else {
        toast.error(
          "Error al eliminar los datos de depósito: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    } finally {
      setIsDeletingDeposito(false);
    }
  };

  // 🟡 Eliminar proyecto → "Proyectos no realizados" + estadoActual = Rechazado + delete
  const handleEliminarProyecto = async () => {
    try {
      setIsDeletingProject(true);

      // 1) Mover la cotización en el pipeline
      await moveCotizacionToEtapa("Proyectos no realizados");

      // 2) Marcar el proyecto como Rechazado
      await axios.put(`/api/proyectos/${proyecto._id}`, {
        estadoActual: "Rechazado",
      });

      // 3) Eliminar el proyecto
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

  // 🟢 "Finalizar" → cambiar estadoActual a la etapa elegida
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

  if (!deposito) {
    return (
      <div className="text-sm text-muted-foreground">
        Este proyecto aún no tiene información de Depósito cargada.
      </div>
    );
  }

  const {
    numeroOrdenDeposito,
    fechaIngresoDeposito,
    responsableRecepcion,
    origenPedido,
    estadoProductoRecibido,
    cantidadUnidades,
    ubicacionSeleccion,
    ubicacionDetalle,
    verificacionEmbalaje,
    identificacion,
    materialAlmacenado,
    materialAlmacenadoOtro,
    controlMedidasOk,
    cantidadPiezasControladas,
    condicionVidrio,
    fotosIngreso,
    fechaSalidaEntrega,
    estadoActualPedido,
    observacionesDeposito,
    usuarioEncargado,
  } = deposito;

  const materialLabel =
    materialAlmacenado === "Otros" && materialAlmacenadoOtro
      ? `Otros – ${materialAlmacenadoOtro}`
      : materialAlmacenado || "-";

  return (
    <div className="space-y-4 text-sm">
      {/* Alert: eliminar solo Depósito */}
      <AlertDialog
        open={deleteDepositoOpen}
        onOpenChange={setDeleteDepositoOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar datos de depósito?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todos los datos cargados en{" "}
              <strong>Depósito</strong> del proyecto{" "}
              <strong>{proyecto.numeroOrden}</strong>.
              <br />
              El proyecto seguirá existiendo, pero la sección de depósito
              quedará vacía.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDeposito}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDeleteDeposito}
              disabled={isDeletingDeposito}
            >
              {isDeletingDeposito ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Eliminando...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Sí, eliminar depósito
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert: eliminar proyecto */}
      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Marcar proyecto como no realizado?</AlertDialogTitle>
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

      {/* Alert: seleccionar nueva etapa al "Finalizar" */}
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

      {/* Info general */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2">
            <span>Información de Depósito</span>
            {estadoActualPedido && (
              <Badge
                className={cn(
                  "text-xs px-2 py-0.5",
                  getEstadoBadgeColor(estadoActualPedido),
                )}
              >
                {estadoActualPedido}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">N° Orden de Depósito</p>
            <p className="font-medium">
              {numeroOrdenDeposito || `${proyecto.numeroOrden ?? "-"}-DEP`}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Fecha de ingreso al depósito
            </p>
            <p className="font-medium">{formatDate(fechaIngresoDeposito)}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Responsable de recepción
            </p>
            <p className="font-medium">{responsableRecepcion || "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Origen del pedido</p>
            <p className="font-medium">{origenPedido || "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Estado del producto recibido
            </p>
            <p className="font-medium">{estadoProductoRecibido || "-"}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Cantidad de unidades</p>
            <p className="font-medium">
              {typeof cantidadUnidades === "number" ? cantidadUnidades : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ubicación & embalaje */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Ubicación y Embalaje</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Ubicación en el depósito
              </p>
              <p className="font-medium">{ubicacionSeleccion || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Detalle / código interno
              </p>
              <p className="font-medium whitespace-pre-line">
                {ubicacionDetalle || "-"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">
                Verificación de embalaje
              </p>
              <p className="font-medium">{verificacionEmbalaje || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Identificación (código / etiqueta / QR)
              </p>
              <p className="font-medium whitespace-pre-line">
                {identificacion || "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material, medidas y vidrio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Material y Control de Medidas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Material almacenado</p>
            <p className="font-medium">{materialLabel}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Control de medidas y piezas
            </p>
            <p className="font-medium">
              {controlMedidasOk ? "Coincide con la orden" : "Sin confirmar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Piezas controladas:{" "}
              {typeof cantidadPiezasControladas === "number"
                ? cantidadPiezasControladas
                : "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Condición del vidrio</p>
            <p className="font-medium">{condicionVidrio || "-"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Fotos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Fotos de ingreso al depósito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {!fotosIngreso || fotosIngreso.length === 0 ? (
            <p className="text-muted-foreground">
              No hay fotos registradas para el ingreso al depósito.
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Mínimo requerido: 2 fotos (bulto y etiqueta visible).
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {fotosIngreso.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-md border overflow-hidden"
                  >
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={`Foto depósito ${idx + 1}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-[11px] px-2 text-center break-all">
                          {url}
                        </span>
                      )}
                    </div>
                    <div className="px-2 py-1 text-[11px] truncate border-t bg-background">
                      Foto {idx + 1}
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Salida y observaciones */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Salida y Observaciones</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">
              Fecha de salida / entrega
            </p>
            <p className="font-medium">
              {fechaSalidaEntrega ? formatDate(fechaSalidaEntrega) : "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              Usuario encargado del caso
            </p>
            <p className="font-medium">{usuarioEncargado || "-"}</p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs text-muted-foreground">
              Observaciones o Informe de Depósito
            </p>
            <p className="font-medium whitespace-pre-line mt-1">
              {observacionesDeposito || "Sin observaciones registradas."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 👉 Acciones sobre el proyecto */}
      <div className="space-y-3 pt-2">
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

          {/* Eliminar solo depósito */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1 border-slate-400/60 text-slate-600 hover:bg-slate-100"
            onClick={() => setDeleteDepositoOpen(true)}
          >
            <Trash2 className="h-3 w-3" />
            Eliminar depósito
          </Button>
        </div>
      </div>
    </div>
  );
}
