"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
  TouchSensor,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { useDebounce } from "use-debounce";
import { useSession } from "next-auth/react";
import { TableCellActions } from "@/components/clientes/TableCellActions";
import {
  Loader2,
  DollarSign,
  MoreVertical,
  Trash2,
  Paperclip,
  Mail,
  LayoutGrid,
  Columns as ColumnsIcon,
  StepBackIcon,
  GripVertical,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateQuoteDialog } from "@/components/cotizaciones/CreateQuoteDialog";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  QuotesPipelineFilters,
  Filters,
} from "@/components/cotizaciones/QuotesPipelineFilters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ViewQuoteFilesDialog } from "@/components/cotizaciones/ViewQuoteFilesDialog";
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
import { toast } from "sonner";
import { FaWhatsapp } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Client } from "@/types/client";
import { StageFormModal } from "@/components/cotizaciones/StageFormModal";
import { IFormField } from "@/types/IFormField";
import { CreateStageDialog } from "@/components/cotizaciones/CreateStageDialog";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { QuoteDetailsSheet } from "@/components/cotizaciones/QuoteDetailsSheet";
import { QuoteDetailsDialog } from "@/components/cotizaciones/QuoteDetailsDialog";

// ✅ Tooltip imports (shadcn)
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GREEN_STAGE_NAMES = new Set([
  "Proyecto por Iniciar",
  "Proyectos no realizados",
  "Proyecto Finalizado",
]);

function sortStagesGreenLast(etapas: Etapa[]) {
  const normal: Etapa[] = [];
  const green: Etapa[] = [];
  for (const e of etapas) {
    if (GREEN_STAGE_NAMES.has(e.nombre)) green.push(e);
    else normal.push(e);
  }
  return [...normal, ...green];
}

interface Etapa {
  _id: string;
  nombre: string;
  color: string;
}

type HistorialFormValue =
  | string
  | number
  | boolean
  | string[]
  | undefined
  | null;

type HistorialDatosFormulario = Record<string, HistorialFormValue> & {
  __precioAnterior?: number;
  __precioNuevo?: number;
};

interface Cotizacion {
  historialEtapas: {
    etapa: { _id: string; nombre: string };
    fecha: string;
    datosFormulario?: HistorialDatosFormulario;
  }[];
  _id: string;
  codigo: string;
  montoTotal: number;
  detalle?: string;
  archivos: string[];
  orden: number;
  etapa: Etapa;
  cliente: {
    _id: string;
    nombreCompleto: string;
    prioridad: "Alta" | "Media" | "Baja";
    telefono?: string;
  };
  vendedor: { _id?: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

type Columns = Record<string, Cotizacion[]>;
type ViewMode = "pipeline" | "table";
type StageColorMap = { [key: string]: string };

// Para precargar valores del modal
type FormValue = string | number | boolean | string[] | undefined;
type IFormularioData = Record<string, FormValue>;

interface PipelineViewProps {
  etapas: Etapa[];
  columns: Columns;
  onDelete: (quoteId: string) => void;
  onUndo: (quoteId: string) => void;
  onDeleteStage: (etapa: Etapa) => void;
  sensors: ReturnType<typeof useSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeQuote: Cotizacion | null;
  stageColors: StageColorMap;
  isFetching: boolean;
  collapsedStages: Record<string, boolean>;
  onToggleCollapse: (stageId: string) => void;
  onOpenDetails: (quoteId: string) => void;
}

/** ✅ Botón icon-only con tooltip */
function IconCta({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** ✅ Helper: "hace X días/horas/minutos" */
function timeAgoEs(date: Date | null) {
  if (!date) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "recién";

  const mins = Math.floor(diffMs / (60 * 1000));
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const weeks = Math.floor(days / 7);

  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours} h`;
  if (days < 7) return `hace ${days} día${days === 1 ? "" : "s"}`;
  return `hace ${weeks} semana${weeks === 1 ? "" : "s"}`;
}

/** Overlay bloqueante */
function BlockingMoveOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-background/90 px-6 py-5 shadow-lg">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          {label || "Procesando..."}
        </p>
      </div>
    </div>
  );
}

function QuoteCardSkeleton() {
  return (
    <div className="mb-2 p-3 border rounded-lg bg-card space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-4 w-1/5" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <div className="flex justify-between items-center pt-2 border-t mt-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

function QuoteCard({
  quote,
  onDelete,
  onUndo,
  stageColors,
  onOpenDetails,
}: {
  quote: Cotizacion;
  onDelete: (quoteId: string) => void;
  onUndo: (quoteId: string) => void;
  stageColors: StageColorMap;
  onOpenDetails: (quoteId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: quote._id,
      data: { type: "Quote", quote },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [isFilesOpen, setFilesOpen] = useState(false);

  const prioridadStyles: Record<string, string> = {
    Alta: "bg-red-500/15 text-red-700 border-red-500/40",
    Media: "bg-yellow-500/15 text-yellow-700 border-yellow-500/40",
    Baja: "bg-blue-500/15 text-blue-700 border-blue-500/40",
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Cotización ${quote.codigo}`);
    const body = encodeURIComponent(
      `Hola ${quote.cliente?.nombreCompleto || ""},\n\nTe escribo por la cotización ${quote.codigo}.\n\nSaludos.`
    );
    window.location.assign(`mailto:?subject=${subject}&body=${body}`);
  };

  function normalizePhoneForWA(raw?: string) {
    if (!raw) return "";
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("54")) return digits;
    const cleaned = digits.replace(/^0+/, "");
    if (cleaned.startsWith("54")) return cleaned;
    return `54${cleaned}`;
  }

  const handleWhatsApp = () => {
    const waPhone =
      normalizePhoneForWA(quote.cliente?.telefono) || "5491111111111";

    const text = encodeURIComponent(
      `Hola ${quote.cliente?.nombreCompleto || ""}, te escribo por la cotización ${quote.codigo}`
    );

    window.open(
      `https://wa.me/${waPhone}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const createdAt = quote.createdAt ? new Date(quote.createdAt) : null;
  const lastMove = quote.historialEtapas?.length
    ? new Date(quote.historialEtapas[quote.historialEtapas.length - 1].fecha)
    : quote.updatedAt
    ? new Date(quote.updatedAt)
    : null;

  const fmt = (d: Date | null) =>
    d
      ? d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
      : "—";

  const lastMoveAgo = timeAgoEs(lastMove);
  const stageColor = stageColors[quote.etapa._id] || quote.etapa.color;

  return (
    <>
      <ViewQuoteFilesDialog
        files={quote.archivos}
        quoteCode={quote.codigo}
        isOpen={isFilesOpen}
        onOpenChange={setFilesOpen}
      />

      <div ref={setNodeRef} style={style}>
        <Card
          className={cn(
            "mb-2 p-0 overflow-hidden",
            "bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/55",
            "shadow-sm hover:shadow-md transition-shadow duration-200",
            "border border-primary/10"
          )}
          onDoubleClick={() => onOpenDetails(quote._id)}
          style={{
            backgroundImage: `linear-gradient(135deg, ${stageColor}18, transparent 60%)`,
          }}
        >
          <CardContent className="p-3">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/listados/${quote.cliente._id}`}>
                      <div className="text-sm font-semibold hover:underline hover:text-primary transition-colors truncate">
                        {quote.cliente.nombreCompleto} - {quote.codigo}
                      </div>
                    </Link>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[11px] font-medium bg-primary/5 border-primary/15"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Nota {lastMoveAgo}</span>
                        </span>
                      </Badge>

                      {quote.cliente?.prioridad && (
                        <span
                          className={cn(
                            "text-[11px] px-2 py-0.5 rounded-full border",
                            prioridadStyles[quote.cliente.prioridad]
                          )}
                        >
                          Prioridad: {quote.cliente.prioridad}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md border",
                    "bg-background text-muted-foreground active:scale-[0.98]",
                    "hover:bg-primary/5"
                  )}
                  aria-label="Arrastrar"
                  title="Arrastrar"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={() => onUndo(quote._id)}
                    >
                      <StepBackIcon className="mr-2 h-4 w-4" /> Deshacer última
                      acción
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onSelect={() => onDelete(quote._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-2 space-y-2">
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                &quot;{quote.detalle || "Sin detalle"}&quot;
              </p>

              <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span>Creada:</span>
                  <span className="font-medium">{fmt(createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Vendedor:</span>
                  <span className="font-medium">
                    {quote.vendedor?.name || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Último movimiento:</span>
                  <span className="font-medium">{fmt(lastMove)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3 mt-3 gap-2">
              <div className="flex items-center gap-2">
                <IconCta label="Ver archivos" onClick={() => setFilesOpen(true)}>
                  <div className="relative">
                    <Paperclip className="h-4 w-4" />
                    <span className="absolute -top-2 -right-2 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 leading-4">
                      {quote.archivos?.length || 0}
                    </span>
                  </div>
                </IconCta>

                <TableCellActions
                  client={quote?.cliente as Client}
                  actionType="notas"
                />
                <div style={{ marginLeft: -6 }}>
                  <TableCellActions
                    client={quote?.cliente as Client}
                    actionType="interacciones"
                  />
                </div>

                <IconCta label="Enviar email" onClick={handleEmail}>
                  <Mail className="h-4 w-4" />
                </IconCta>

                <IconCta label="Enviar WhatsApp" onClick={handleWhatsApp}>
                  <FaWhatsapp className="h-4 w-4" />
                </IconCta>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 font-semibold text-base whitespace-nowrap">
                  <DollarSign className="h-4 w-4" />
                  <span>{quote.montoTotal.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function QuoteColumn({
  id,
  etapa,
  quotes,
  onDelete,
  stageColors,
  isFetching,
  onUndo,
  onDeleteStage,
  highlight = false,
  collapsed = false,
  onToggleCollapse,
  onOpenDetails,
}: {
  id: string;
  etapa: Etapa;
  quotes: Cotizacion[];
  onDelete: (quoteId: string) => void;
  onUndo: (quoteId: string) => void;
  stageColors: StageColorMap;
  isFetching: boolean;
  onDeleteStage: (etapa: Etapa) => void;
  highlight?: boolean;
  collapsed?: boolean;
  onToggleCollapse: () => void;
  onOpenDetails: (quoteId: string) => void;
}) {
  const quoteIds = useMemo(() => quotes.map((q) => q._id), [quotes]);
  const totalAmount = useMemo(
    () => quotes.reduce((sum, quote) => sum + quote.montoTotal, 0),
    [quotes]
  );

  const isGreenLocked = GREEN_STAGE_NAMES.has(etapa.nombre);
  const { setNodeRef, isOver } = useSortable({ id, data: { type: "Column" } });

  const stageColor = stageColors[etapa._id] || etapa.color;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        collapsed ? "w-12" : "w-80",
        "h-full flex flex-col flex-shrink-0 rounded-xl transition-all duration-200 border",
        "bg-gradient-to-b from-background/80 to-muted/30 backdrop-blur supports-[backdrop-filter]:bg-background/55 shadow-sm",
        isOver && "ring-2 ring-primary/20",
        highlight &&
          "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-500/10",
        isOver && highlight && "bg-emerald-500/15"
      )}
    >
      <div
        className={cn(
          "p-3 pb-2 sticky top-0 z-10 rounded-t-xl border-b",
          "bg-background/75 backdrop-blur-sm",
          collapsed && "p-2"
        )}
        style={{
          backgroundImage: `linear-gradient(135deg, ${stageColor}22, transparent 55%)`,
        }}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleCollapse}
              title="Expandir"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div
              className={cn(
                "flex items-center gap-2 select-none",
                "[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180"
              )}
              title={etapa.nombre}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: stageColor }}
              />
              <span className="font-semibold text-sm leading-none">
                {etapa.nombre}
              </span>
            </div>

            <span className="text-[11px] font-semibold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
              {quotes.length}
            </span>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stageColor }}
                />
                <h2 className="font-semibold text-base truncate">{etapa.nombre}</h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleCollapse}
                  title="Minimizar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      disabled={isGreenLocked}
                      onSelect={() => {
                        if (isGreenLocked) {
                          toast.error("Esta etapa no se puede eliminar.");
                          return;
                        }
                        if (quotes.length > 0) {
                          toast.error(
                            "No podés eliminar esta etapa porque tiene leads. Movelos a otra etapa antes de eliminar."
                          );
                          return;
                        }
                        onDeleteStage(etapa);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Eliminar etapa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex items-center gap-1 text-base font-bold">
              <span className="text-xs font-semibold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                {quotes.length} Leads
              </span>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="flex-grow overflow-y-auto p-2">
            {isFetching ? (
              <div className="space-y-2">
                <QuoteCardSkeleton />
                <QuoteCardSkeleton />
                <QuoteCardSkeleton />
              </div>
            ) : (
              <>
                <SortableContext items={quoteIds}>
                  {quotes.map((quote) => (
                    <QuoteCard
                      key={quote._id}
                      quote={quote}
                      onDelete={onDelete}
                      onUndo={onUndo}
                      stageColors={stageColors}
                      onOpenDetails={onOpenDetails}
                    />
                  ))}
                </SortableContext>

                {quotes.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-center text-sm text-muted-foreground p-4 italic">
                      Arrastrá una cotización aquí
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t px-3 py-2 bg-muted/35 text-[11px] flex flex-col gap-1 rounded-b-xl">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Leads</span>
              <span className="font-semibold">{quotes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">
                ${totalAmount.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuotesTableView({
  quotes,
  onDelete,
  onUndo,
  stageColors,
  onOpenDetails,
}: {
  quotes: Cotizacion[];
  onDelete: (quoteId: string) => void;
  onUndo: (quoteId: string) => void;
  stageColors: StageColorMap;
  onOpenDetails: (quoteId: string) => void;
}) {
  const [isFilesOpen, setFilesOpen] = useState(false);
  const [filesQuote, setFilesQuote] = useState<Cotizacion | null>(null);

  const openFiles = (q: Cotizacion) => {
    setFilesQuote(q);
    setFilesOpen(true);
  };

  const handleEmail = (q: Cotizacion) => {
    const subject = encodeURIComponent(`Cotización ${q.codigo}`);
    const body = encodeURIComponent(
      `Hola ${q.cliente?.nombreCompleto || ""},\n\nTe escribo por la cotización ${q.codigo}.\n\nSaludos.`
    );
    window.location.assign(`mailto:?subject=${subject}&body=${body}`);
  };

  function normalizePhoneForWA(raw?: string) {
    if (!raw) return "";
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("54")) return digits;
    const cleaned = digits.replace(/^0+/, "");
    if (cleaned.startsWith("54")) return cleaned;
    return `54${cleaned}`;
  }

  const handleWhatsApp = (q: Cotizacion) => {
    const waPhone = normalizePhoneForWA(q.cliente?.telefono) || "5491111111111";
    const text = encodeURIComponent(
      `Hola ${q.cliente?.nombreCompleto || ""}, te escribo por la cotización ${q.codigo}`
    );
    window.open(
      `https://wa.me/${waPhone}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <>
      <ViewQuoteFilesDialog
        files={filesQuote?.archivos || []}
        quoteCode={filesQuote?.codigo || ""}
        isOpen={isFilesOpen}
        onOpenChange={(open) => {
          setFilesOpen(open);
          if (!open) setFilesQuote(null);
        }}
      />

      <Card className="overflow-hidden border-primary/10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/55">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Últ. mov.</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {quotes.length > 0 ? (
              quotes.map((quote) => {
                const lastMove = quote.historialEtapas?.length
                  ? new Date(
                      quote.historialEtapas[quote.historialEtapas.length - 1].fecha
                    )
                  : quote.updatedAt
                  ? new Date(quote.updatedAt)
                  : null;

                return (
                  <TableRow
                    key={quote._id}
                    className="cursor-pointer hover:bg-primary/5"
                    onClick={() => onOpenDetails(quote._id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="truncate">
                          {quote.cliente.nombreCompleto}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Nota {timeAgoEs(lastMove)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {quote.codigo}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              stageColors[quote.etapa._id] || quote.etapa.color,
                          }}
                        />
                        <span>{quote.etapa.nombre}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {quote.vendedor?.name || "—"}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {lastMove
                        ? lastMove.toLocaleDateString("es-AR", {
                            dateStyle: "short",
                          })
                        : "—"}
                    </TableCell>

                    <TableCell className="text-right font-semibold">
                      ${quote.montoTotal.toLocaleString("es-AR")}
                    </TableCell>

                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <IconCta label="Ver archivos" onClick={() => openFiles(quote)}>
                          <div className="relative">
                            <Paperclip className="h-4 w-4" />
                            <span className="absolute -top-2 -right-2 text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 leading-4">
                              {quote.archivos?.length || 0}
                            </span>
                          </div>
                        </IconCta>

                        <TableCellActions
                          client={quote?.cliente as Client}
                          actionType="notas"
                        />
                        <div style={{ marginLeft: -6 }}>
                          <TableCellActions
                            client={quote?.cliente as Client}
                            actionType="interacciones"
                          />
                        </div>

                        <IconCta
                          label="Enviar email"
                          onClick={() => handleEmail(quote)}
                        >
                          <Mail className="h-4 w-4" />
                        </IconCta>

                        <IconCta
                          label="Enviar WhatsApp"
                          onClick={() => handleWhatsApp(quote)}
                        >
                          <FaWhatsapp className="h-4 w-4" />
                        </IconCta>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-9 w-9">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => onUndo(quote._id)}
                              className="focus:bg-primary/10"
                            >
                              <StepBackIcon className="mr-2 h-4 w-4" />
                              Deshacer última acción
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-500/10"
                              onSelect={() => onDelete(quote._id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron negocios con los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

function PipelineView({
  etapas,
  columns,
  onDelete,
  onUndo,
  onDeleteStage,
  sensors,
  onDragStart,
  onDragEnd,
  activeQuote,
  stageColors,
  isFetching,
  collapsedStages,
  onToggleCollapse,
  onOpenDetails,
}: PipelineViewProps) {
  const orderedEtapas = useMemo(
    () => (etapas ? sortStagesGreenLast(etapas) : []),
    [etapas]
  );

  return (
    <>
      <div className="hidden md:flex" style={{ height: "calc(100vh - 206px)" }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 h-full items-start overflow-x-auto w-full pb-2">
            <SortableContext items={orderedEtapas.map((e) => e._id)}>
              {orderedEtapas.map((etapa) => (
                <QuoteColumn
                  key={etapa._id}
                  id={etapa._id}
                  etapa={etapa}
                  quotes={columns[etapa._id] || []}
                  onDelete={onDelete}
                  onUndo={onUndo}
                  onDeleteStage={onDeleteStage}
                  stageColors={stageColors}
                  isFetching={isFetching}
                  highlight={
                    etapa.nombre === "Proyecto por Iniciar" ||
                    etapa.nombre === "Proyectos no realizados" ||
                    etapa.nombre === "Proyecto Finalizado"
                  }
                  collapsed={!!collapsedStages[etapa._id]}
                  onToggleCollapse={() => onToggleCollapse(etapa._id)}
                  onOpenDetails={onOpenDetails}
                />
              ))}
            </SortableContext>
          </div>

          {typeof document !== "undefined" &&
            createPortal(
              <DragOverlay>
                {activeQuote ? (
                  <div className="w-80 scale-105 opacity-95 shadow-2xl">
                    <QuoteCard
                      key={activeQuote._id}
                      quote={activeQuote}
                      onDelete={onDelete}
                      onUndo={onUndo}
                      stageColors={stageColors}
                      onOpenDetails={onOpenDetails}
                    />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
        </DndContext>
      </div>

      <div className="md:hidden" style={{ height: "calc(100vh - 206px)" }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex h-full items-start overflow-x-auto w-full pb-2 pr-2 gap-3 snap-x snap-mandatory">
            <SortableContext items={etapas?.map((e: Etapa) => e._id) || []}>
              {etapas?.map((etapa: Etapa) => (
                <div
                  key={etapa._id}
                  className="snap-start w-[92vw] max-w-[420px] flex-shrink-0"
                >
                  <QuoteColumn
                    key={etapa._id}
                    id={etapa._id}
                    etapa={etapa}
                    quotes={columns[etapa._id] || []}
                    onDelete={onDelete}
                    onUndo={onUndo}
                    onDeleteStage={onDeleteStage}
                    stageColors={stageColors}
                    isFetching={isFetching}
                    highlight={
                      etapa.nombre === "Proyecto por Iniciar" ||
                      etapa.nombre === "Proyectos no realizados" ||
                      etapa.nombre === "Proyecto Finalizado"
                    }
                    collapsed={!!collapsedStages[etapa._id]}
                    onToggleCollapse={() => onToggleCollapse(etapa._id)}
                    onOpenDetails={onOpenDetails}
                  />
                </div>
              ))}
            </SortableContext>
          </div>

          {typeof document !== "undefined" &&
            createPortal(
              <DragOverlay>
                {activeQuote ? (
                  <div className="w-[92vw] max-w-[420px] scale-105 opacity-95 shadow-2xl">
                    <QuoteCard
                      key={activeQuote._id}
                      quote={activeQuote}
                      onDelete={onDelete}
                      onUndo={onUndo}
                      stageColors={stageColors}
                      onOpenDetails={onOpenDetails}
                    />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body
            )}
        </DndContext>
      </div>
    </>
  );
}

/** ✅ Detecta si el formulario de una etapa ya fue completado (mínimo) */
function hasStageFormFilled(quote: Cotizacion, stageId: string) {
  const entries = quote.historialEtapas || [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const h = entries[i];
    if (h?.etapa?._id === stageId) {
      const df = h.datosFormulario;
      if (!df) return false;
      const keys = Object.keys(df).filter((k) => !k.startsWith("__"));
      return keys.length > 0;
    }
  }
  return false;
}

/** Normalización: mismo helper que en el modal */
const toFieldName = (title: string): string => {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

export default function PipelinePage() {
  const [isStageFormModalOpen, setIsStageFormModalOpen] = useState(false);
  const [formFieldsForStage, setFormFieldsForStage] = useState<IFormField[]>([]);
  const [quoteToMove, setQuoteToMove] = useState<Cotizacion | null>(null);
  const [newStageId, setNewStageId] = useState<string | null>(null);
  const [isQuoteSidebarOpen, setIsQuoteSidebarOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const [initialFormData, setInitialFormData] = useState<IFormularioData>({});

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [columns, setColumns] = useState<Columns>({});
  const [activeQuote, setActiveQuote] = useState<Cotizacion | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [stageToDelete, setStageToDelete] = useState<Etapa | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");

  const [isMoveBlocking, setIsMoveBlocking] = useState(false);
  const [moveBlockingLabel, setMoveBlockingLabel] = useState<string>("");

  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>(
    {}
  );

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages((prev) => ({ ...prev, [stageId]: !prev[stageId] }));
  };

  const collapseAll = () => {
    if (!etapas) return;
    const next: Record<string, boolean> = {};
    etapas.forEach((e) => (next[e._id] = true));
    setCollapsedStages(next);
  };

  const expandAll = () => setCollapsedStages({});

  const openQuoteSidebar = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setIsQuoteSidebarOpen(true);
  };

  const openDetailsDialog = (id: string) => {
    setDetailsId(id);
    setDetailsOpen(true);
  };

  // ✅ filtros: admin por defecto ve TODO (vendedorId = "")
  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window === "undefined") {
      return {
        searchTerm: "",
        vendedorId: "",
        sucursalId: "",
        etapaId: "",
        dateRange: undefined,
      } as Filters;
    }

    const savedFilters = localStorage.getItem("quotePipelineFilters");
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      if (parsed.dateRange?.from) parsed.dateRange.from = new Date(parsed.dateRange.from);
      if (parsed.dateRange?.to) parsed.dateRange.to = new Date(parsed.dateRange.to);
      return parsed;
    }

    return {
      searchTerm: "",
      vendedorId: "",
      sucursalId: "",
      etapaId: "",
      dateRange: undefined,
    };
  });

  const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

  // ✅ set default vendedor solo si NO sos admin
  useEffect(() => {
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user?.id) return;

    if (role !== "admin" && !filters.vendedorId) {
      setFilters((prev) => ({ ...prev, vendedorId: session.user.id as string }));
    }
  }, [session, filters.vendedorId]);

  useEffect(() => {
    localStorage.setItem("quotePipelineFilters", JSON.stringify(filters));
  }, [filters]);

  const { data: etapas, isLoading: isLoadingEtapas } = useQuery<Etapa[]>({
    queryKey: ["etapasCotizacion"],
    queryFn: async () => (await axios.get("/api/etapas-cotizacion")).data.data,
  });

  const stageColors = useMemo(() => {
    const colorMap: StageColorMap = {};
    if (!etapas) return colorMap;

    const themePrimaryColor = { h: 160, s: 35, l: 48 };
    const total = etapas.length;

    etapas.forEach((etapa, index) => {
      if (
        etapa.nombre === "Proyecto por Iniciar" ||
        etapa.nombre === "Proyectos no realizados" ||
        etapa.nombre === "Proyecto Finalizado"
      ) {
        colorMap[etapa._id] = `hsla(${themePrimaryColor.h}, ${themePrimaryColor.s}%, ${themePrimaryColor.l}%, 1.0)`;
        return;
      }

      const maxOpacity = 1.0;
      const minOpacity = 0.2;

      if (total <= 1) {
        colorMap[etapa._id] = `hsla(${themePrimaryColor.h}, ${themePrimaryColor.s}%, ${themePrimaryColor.l}%, ${maxOpacity})`;
        return;
      }

      const opacityStep = (maxOpacity - minOpacity) / (total - 1);
      const opacity = maxOpacity - index * opacityStep;
      colorMap[etapa._id] = `hsla(${themePrimaryColor.h}, ${themePrimaryColor.s}%, ${themePrimaryColor.l}%, ${opacity})`;
    });

    return colorMap;
  }, [etapas]);

  // ✅ queryKey COMPLETO: incluye sucursalId y etapaId (si no, no refetch)
  const queryKey = [
    "cotizacionesPipeline",
    debouncedSearchTerm,
    filters.vendedorId,
    filters.sucursalId,
    filters.etapaId,
    filters.dateRange?.from?.toISOString() ?? "",
    filters.dateRange?.to?.toISOString() ?? "",
  ];

  const {
    data: cotizaciones,
    isLoading: isLoadingQuotes,
    isFetching,
  } = useQuery<Cotizacion[]>({
    queryKey,
    queryFn: async () => {
      const params = {
        searchTerm: debouncedSearchTerm || undefined,
        vendedorId: filters.vendedorId || undefined, // "" => no filtra
        sucursalId: filters.sucursalId || undefined,
        etapaId: filters.etapaId || undefined,
        fechaDesde: filters.dateRange?.from ? filters.dateRange.from.toISOString() : undefined,
        fechaHasta: filters.dateRange?.to ? filters.dateRange.to.toISOString() : undefined,
      };
      const { data } = await axios.get("/api/cotizaciones", { params });
      return data.data;
    },
    enabled: !!etapas, // ✅ admin puede tener vendedorId vacío
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (etapas && cotizaciones) {
      const initialColumns: Columns = {};
      etapas.forEach((etapa) => (initialColumns[etapa._id] = []));
      cotizaciones.forEach((quote) => {
        const stageId = quote.etapa?._id;
        if (stageId && initialColumns[stageId]) {
          initialColumns[stageId].push(quote);
        }
      });
      Object.keys(initialColumns).forEach((stageId) => {
        initialColumns[stageId].sort((a, b) => a.orden - b.orden);
      });
      setColumns(initialColumns);
    }
  }, [etapas, cotizaciones]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  // ✅ SIEMPRE usamos /move (con o sin form)
  const updateQuoteWithFormData = useMutation({
    mutationFn: (data: {
      quoteId: string;
      newStageId: string;
      formData: Record<string, unknown>;
      montoTotal?: number;
    }) =>
      axios.put(`/api/cotizaciones/${data.quoteId}/move`, {
        etapa: data.newStageId,
        historial: data.formData,
        montoTotal: data.montoTotal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotizacionesPipeline"] });
    },
    onError: () => {
      toast.error("Error al mover/guardar la cotización.");
    },
  });

  const reorderQuotesMutation = useMutation({
    mutationFn: (data: { stageId: string; orderedQuoteIds: string[] }) =>
      axios.put(`/api/cotizaciones/reorder`, data),
    onError: () => {
      toast.error("Error al guardar el nuevo orden.");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => axios.delete(`/api/cotizaciones/${quoteId}`),
    onSuccess: () => {
      toast.success("Cotización eliminada con éxito.");
      queryClient.invalidateQueries({ queryKey });
      setQuoteToDelete(null);
    },
    onError: () => toast.error("Error al eliminar la cotización."),
  });

  type DeleteStageErrorPayload = {
    success?: boolean;
    error?: string;
    code?: string;
    leadsCount?: number;
  };

  const deleteStageMutation = useMutation({
    mutationFn: (stageId: string) =>
      axios.delete(`/api/etapas-cotizacion/${stageId}`),
    onSuccess: async () => {
      toast.success("Etapa eliminada con éxito.");
      await queryClient.invalidateQueries({ queryKey: ["etapasCotizacion"] });
      await queryClient.invalidateQueries({ queryKey });
      setStageToDelete(null);
    },
    onError: (err: unknown) => {
      let status: number | undefined;
      let message = "No se pudo eliminar la etapa.";

      if (err instanceof AxiosError) {
        status = err.response?.status;
        const payload = err.response?.data as DeleteStageErrorPayload | undefined;
        message = payload?.error || err.message || message;
      }

      if (status === 409) {
        toast.error(message);
        return;
      }

      toast.error(message);
    },
  });

  function findContainer(id: string) {
    if (columns[id]) return id;
    return Object.keys(columns).find((key) =>
      columns[key].some((item) => item._id === id)
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const quote = cotizaciones?.find((q) => q._id === active.id);
    if (quote) setActiveQuote(quote);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveQuote(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      const quote = columns[activeContainer].find((q) => q._id === activeId);
      if (!quote) return;

      setMoveBlockingLabel("Verificando requisitos de la etapa...");
      setIsMoveBlocking(true);

      try {
        const { data } = await axios.get(
          `/api/formularios-etapa/${overContainer}`
        );
        const camposFormulario: IFormField[] = data.data?.campos || [];

        // Si hay formulario -> abrir modal
        if (camposFormulario.length > 0) {
          const preload: IFormularioData = {};
          camposFormulario.forEach((f) => {
            const key = toFieldName(f.titulo);
            if (f.tipo === "precio") preload[key] = quote.montoTotal;
          });

          setInitialFormData(preload);
          setFormFieldsForStage(camposFormulario);
          setQuoteToMove(quote);
          setNewStageId(overContainer);
          setIsStageFormModalOpen(true);
          setIsMoveBlocking(false);
          return;
        }

        // ✅ Si NO hay formulario -> mover directo usando /move con historial {}
        setMoveBlockingLabel("Moviendo cotización...");

        const newSourceItems = [...columns[activeContainer]];
        const newDestItems = [...columns[overContainer]];

        const quoteIndex = newSourceItems.findIndex((q) => q._id === activeId);
        if (quoteIndex === -1) {
          setIsMoveBlocking(false);
          return;
        }

        const [movedItem] = newSourceItems.splice(quoteIndex, 1);

        const nuevaEtapa = etapas?.find((e) => e._id === overContainer);
        if (nuevaEtapa) movedItem.etapa = nuevaEtapa;

        newDestItems.unshift(movedItem);
        setColumns((prev) => ({
          ...prev,
          [activeContainer]: newSourceItems,
          [overContainer]: newDestItems,
        }));

        try {
          await updateQuoteWithFormData.mutateAsync({
            quoteId: activeId,
            newStageId: overContainer,
            formData: {}, // <- clave para /move
            montoTotal: movedItem.montoTotal,
          });

          if (nuevaEtapa?.nombre === "Proyecto por Iniciar") {
            setMoveBlockingLabel("Creando proyecto...");
            try {
              await axios.post("/api/proyectos", {
                clienteId: movedItem.cliente._id,
                cotizacionId: movedItem._id,
                estadoActual: null,
              });

              toast.success(
                `Proyecto creado para ${
                  movedItem.cliente?.nombreCompleto || "el cliente"
                }`
              );
            } catch (error) {
              console.error("Error creando proyecto desde cotización", error);
              toast.error(
                "Se movió la cotización pero no se pudo crear el proyecto."
              );
            }
          } else {
            toast.success("Cotización movida con éxito.");
          }
        } catch (err) {
          console.error("Error moviendo cotización:", err);
          toast.error("Error al mover la cotización.");
          queryClient.invalidateQueries({ queryKey });
        } finally {
          setIsMoveBlocking(false);
          setMoveBlockingLabel("");
        }
      } catch (err) {
        console.error("Error al cargar formulario o mover:", err);
        toast.error(
          "Error al cargar el formulario de la etapa o al mover la cotización."
        );
        queryClient.invalidateQueries({ queryKey: ["cotizacionesPipeline"] });
        setIsMoveBlocking(false);
        setMoveBlockingLabel("");
      }
    } else {
      // reorder dentro de la misma columna
      const activeIndex = columns[activeContainer].findIndex(
        (q) => q._id === activeId
      );
      const overIndex = columns[overContainer].findIndex(
        (q) => q._id === overId
      );

      if (activeIndex !== overIndex) {
        const newOrderedQuotes = arrayMove(
          columns[overContainer],
          activeIndex,
          overIndex
        );
        setColumns((prev) => ({ ...prev, [overContainer]: newOrderedQuotes }));

        reorderQuotesMutation.mutate({
          stageId: overContainer,
          orderedQuoteIds: newOrderedQuotes.map((q) => q._id),
        });
      }
    }
  }

  const undoQuoteStage = useMutation({
    mutationFn: (quoteId: string) => axios.patch(`/api/cotizaciones/${quoteId}/undo`),
    onSuccess: () => {
      toast.success("Se deshizo la última acción");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error("No se pudo deshacer la acción"),
  });

  const handleUndo = (quoteId: string) => undoQuoteStage.mutate(quoteId);

  // ====== Auto modal para lead nuevo (evita F5 y evita reabrir si ya está lleno) ======
  const prevIdsRef = useRef<Set<string>>(new Set());
  const handledNewLeadsRef = useRef<Set<string>>(new Set());
  const didInitRef = useRef(false);

  useEffect(() => {
    if (!cotizaciones?.length) return;
    if (!etapas?.length) return;

    if (!didInitRef.current) {
      prevIdsRef.current = new Set(cotizaciones.map((q) => q._id));
      didInitRef.current = true;
      return;
    }

    if (isStageFormModalOpen) {
      prevIdsRef.current = new Set(cotizaciones.map((q) => q._id));
      return;
    }

    const currentIds = new Set(cotizaciones.map((q) => q._id));
    const prevIds = prevIdsRef.current;

    const newQuotes = cotizaciones.filter(
      (q) => !prevIds.has(q._id) && !handledNewLeadsRef.current.has(q._id)
    );

    prevIdsRef.current = currentIds;

    if (!newQuotes.length) return;

    const newest = [...newQuotes].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    })[0];

    handledNewLeadsRef.current.add(newest._id);

    const stageId = newest.etapa?._id;
    if (!stageId) return;

    if (hasStageFormFilled(newest, stageId)) return;

    (async () => {
      try {
        setMoveBlockingLabel("Verificando formulario de la etapa...");
        setIsMoveBlocking(true);

        const { data } = await axios.get(`/api/formularios-etapa/${stageId}`);
        const camposFormulario: IFormField[] = data.data?.campos || [];
        if (!camposFormulario.length) return;

        const preload: IFormularioData = {};
        camposFormulario.forEach((f) => {
          const key = toFieldName(f.titulo);
          if (f.tipo === "precio") preload[key] = newest.montoTotal;
        });

        setInitialFormData(preload);
        setFormFieldsForStage(camposFormulario);
        setQuoteToMove(newest);
        setNewStageId(stageId);
        setIsStageFormModalOpen(true);
      } catch (e) {
        console.error("Error verificando formulario de etapa para nuevo lead:", e);
      } finally {
        setIsMoveBlocking(false);
        setMoveBlockingLabel("");
      }
    })();
  }, [cotizaciones, etapas, isStageFormModalOpen]);

  if (isLoadingEtapas) {
    return (
      <div className="p-10 text-center flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const isInitialFormSameStage =
    !!quoteToMove && !!newStageId && quoteToMove.etapa._id === newStageId;

  return (
    <div className="flex flex-col bg-gradient-to-b from-background via-muted/30 to-muted/50">
      <QuoteDetailsSheet
        open={isQuoteSidebarOpen}
        onOpenChange={setIsQuoteSidebarOpen}
        quoteId={selectedQuoteId}
      />
      <BlockingMoveOverlay show={isMoveBlocking} label={moveBlockingLabel} />
      <QuoteDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        quoteId={detailsId}
      />

      <div className="p-4 border-b flex flex-col gap-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Negocios</h1>

          <div className="flex gap-2 w-full sm:w-auto">
            <CreateStageDialog />
            <CreateQuoteDialog />
          </div>
        </div>

        <StageFormModal
          isOpen={isStageFormModalOpen}
          onOpenChange={(open) => {
            setIsStageFormModalOpen(open);
            if (!open) {
              setInitialFormData({});
              setQuoteToMove(null);
              setNewStageId(null);
              setFormFieldsForStage([]);
            }
          }}
          title="Completa los datos para esta etapa"
          description={
            isInitialFormSameStage
              ? "Agrega la información requerida para esta etapa."
              : "Agrega la información requerida antes de mover la cotización."
          }
          formFields={formFieldsForStage}
          quoteId={quoteToMove?._id || ""}
          initialData={initialFormData}
          onSave={async (formData) => {
            if (!quoteToMove || !newStageId) return;

            const activeContainer = quoteToMove.etapa._id;
            const overContainer = newStageId;
            const quoteId = quoteToMove._id;

            let newMontoTotal = quoteToMove.montoTotal;
            const precioField = formFieldsForStage.find((f) => f.tipo === "precio");
            if (precioField) {
              const key = toFieldName(precioField.titulo);
              const raw = formData[key];
              const parsed = typeof raw === "number" ? raw : Number(raw);
              if (Number.isFinite(parsed)) newMontoTotal = parsed;
            }

            const newEtapa = etapas?.find((e) => e._id === overContainer);

            const movedQuote: Cotizacion = {
              ...quoteToMove,
              montoTotal: newMontoTotal,
              etapa: newEtapa || quoteToMove.etapa,
            };

            setColumns((prev) => {
              const newPrev = { ...prev };
              const source = newPrev[activeContainer] || [];
              const dest = newPrev[overContainer] || [];
              const sourceWithout = source.filter((q) => q._id !== quoteId);

              const nextDest =
                activeContainer === overContainer
                  ? [movedQuote, ...sourceWithout]
                  : [movedQuote, ...dest];

              return {
                ...newPrev,
                [activeContainer]:
                  activeContainer === overContainer ? nextDest : sourceWithout,
                ...(activeContainer !== overContainer
                  ? { [overContainer]: nextDest }
                  : {}),
              };
            });

            setMoveBlockingLabel(
              activeContainer === overContainer
                ? "Guardando formulario..."
                : "Moviendo cotización..."
            );
            setIsMoveBlocking(true);

            try {
              await updateQuoteWithFormData.mutateAsync({
                quoteId: quoteToMove._id,
                newStageId,
                formData,
                montoTotal: newMontoTotal,
              });

              toast.success(
                activeContainer === overContainer
                  ? "Datos guardados con éxito."
                  : "Cotización movida y actualizada con éxito."
              );

              if (
                activeContainer !== overContainer &&
                newEtapa?.nombre === "Proyecto por Iniciar"
              ) {
                setMoveBlockingLabel("Creando proyecto...");
                try {
                  await axios.post("/api/proyectos", {
                    clienteId: quoteToMove.cliente._id,
                    cotizacionId: quoteToMove._id,
                    estadoActual: null,
                  });
                  toast.success(
                    `Proyecto creado para ${
                      quoteToMove.cliente?.nombreCompleto || "el cliente"
                    }`
                  );
                } catch (error) {
                  console.error("Error creando proyecto desde cotización", error);
                  toast.error(
                    "Se movió la cotización pero no se pudo crear el proyecto."
                  );
                }
              }
            } finally {
              setIsMoveBlocking(false);
              setMoveBlockingLabel("");
              setQuoteToMove(null);
              setNewStageId(null);
              setInitialFormData({});
              setFormFieldsForStage([]);
            }
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center px-4 py-3 gap-3 bg-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/30 border-b">
        <div className="flex-grow">
          <QuotesPipelineFilters
            filters={filters}
            setFilters={setFilters}
            etapas={etapas || []}
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={collapseAll}>
            Colapsar todo
          </Button>
          <Button type="button" variant="outline" onClick={expandAll}>
            Expandir todo
          </Button>
        </div>

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value: ViewMode) => value && setViewMode(value)}
          className="w-full md:w-auto p-0.5 rounded-md bg-primary/10"
        >
          <ToggleGroupItem
            value="pipeline"
            aria-label="Vista Pipeline"
            className="w-1/2 md:w-auto h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          >
            <ColumnsIcon className="h-4 w-4 mr-2" /> Pipeline
          </ToggleGroupItem>
          <ToggleGroupItem
            value="table"
            aria-label="Vista Tabla"
            className="w-1/2 md:w-auto h-9 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm"
          >
            <LayoutGrid className="h-4 w-4 mr-2" /> Tabla
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex-grow overflow-auto px-4 py-4">
        <AlertDialog open={!!quoteToDelete} onOpenChange={() => setQuoteToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la cotización permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteQuoteMutation.mutate(quoteToDelete!)}
                className="bg-red-600 hover:bg-red-700"
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!stageToDelete} onOpenChange={() => setStageToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar etapa</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la etapa y su formulario asociado. Si la etapa contiene leads,
                se te pedirá moverlos antes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteStageMutation.mutate(stageToDelete!._id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Sí, eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {viewMode === "pipeline" ? (
          <PipelineView
            etapas={etapas || []}
            columns={columns}
            onDelete={setQuoteToDelete}
            onUndo={handleUndo}
            onDeleteStage={(etapa) => setStageToDelete(etapa)}
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            activeQuote={activeQuote}
            stageColors={stageColors}
            isFetching={isFetching || isLoadingQuotes}
            collapsedStages={collapsedStages}
            onToggleCollapse={toggleStageCollapse}
            onOpenDetails={openQuoteSidebar}
          />
        ) : (
          <QuotesTableView
            quotes={cotizaciones || []}
            onDelete={setQuoteToDelete}
            onUndo={handleUndo}
            stageColors={stageColors}
            onOpenDetails={openDetailsDialog}
          />
        )}
      </div>
    </div>
  );
}