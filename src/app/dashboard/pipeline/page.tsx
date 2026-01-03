"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import axios from "axios";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CreateQuoteDialog } from "@/components/cotizaciones/CreateQuoteDialog";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuotesPipelineFilters, Filters } from "@/components/cotizaciones/QuotesPipelineFilters";
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

interface Etapa {
  _id: string;
  nombre: string;
  color: string;
}

interface Cotizacion {
  historialEtapas: { etapa: { _id: string; nombre: string }; fecha: string }[];
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
  };
  vendedor: { name: string };
}

type Columns = Record<string, Cotizacion[]>;
type ViewMode = "pipeline" | "table";
type StageColorMap = { [key: string]: string };

interface PipelineViewProps {
  etapas: Etapa[];
  columns: Columns;
  onDelete: (quoteId: string) => void;
  onUndo: (quoteId: string) => void;
  sensors: ReturnType<typeof useSensors>;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeQuote: Cotizacion | null;
  stageColors: StageColorMap;
  isFetching: boolean;
}

/** Overlay bloqueante para movimientos */
function BlockingMoveOverlay({ show, label }: { show: boolean; label?: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-background/90 px-6 py-5 shadow-lg">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          {label || "Moviendo cotización..."}
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
}: {
  quote: Cotizacion;
  onDelete: (quoteId: string) => void;
  onUndo: (quoteId: string) => void;
  stageColors: StageColorMap;
}) {
  // ✅ Cambio clave para mobile: listeners SOLO en un "handle"
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
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
    Alta: "bg-red-500/20 text-red-700 border-red-500/50",
    Media: "bg-yellow-500/20 text-yellow-700 border-yellow-500/50",
    Baja: "bg-blue-500/20 text-blue-700 border-blue-500/50",
  };

  const handleEmail = () => {
    if (quote.cliente?.nombreCompleto) {
      window.location.href = `mailto:?subject=Cotización ${quote.codigo}&body=Hola ${quote.cliente.nombreCompleto}, ...`;
    }
  };

  const handleWhatsApp = () => {
    const phone = "5491111111111";
    const message = encodeURIComponent(
      `Hola ${quote.cliente?.nombreCompleto}, te escribo por la cotización ${quote.codigo}`,
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <>
      <ViewQuoteFilesDialog
        files={quote.archivos}
        quoteCode={quote.codigo}
        isOpen={isFilesOpen}
        onOpenChange={setFilesOpen}
      />

      <div ref={setNodeRef} style={style}>
        <Card className="mb-2 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3">
            {quote?.historialEtapas && quote.historialEtapas.length > 0 && (
              <div className="flex gap-1 mb-2">
                {quote.historialEtapas.map((h, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border"
                    style={{
                      backgroundColor: stageColors[h.etapa?._id] || "#ccc",
                    }}
                    title={`${h.etapa?.nombre} - ${new Date(h.fecha).toLocaleDateString(
                      "es-AR",
                    )}`}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {quote.codigo}
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 text-xs ml-1 align-middle",
                      prioridadStyles[quote.cliente.prioridad] || "",
                    )}
                  >
                    {quote.cliente.prioridad}
                  </Badge>
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* ✅ Handle de drag (evita arrastre accidental en mobile) */}
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground active:scale-[0.98]"
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
                      <StepBackIcon className="mr-2 h-4 w-4" /> Deshacer última acción
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

            <div className="mt-2">
              <Link href={`/dashboard/clientes/${quote.cliente._id}`}>
                <p className="text-sm font-semibold hover:underline hover:text-primary transition-colors truncate">
                  {quote.cliente.nombreCompleto}
                </p>
              </Link>
              <p className="text-xs text-muted-foreground italic line-clamp-2">
                &quot;{quote.detalle || "Sin detalle"}&quot;
              </p>
            </div>

            <div className="flex items-center justify-between border-t pt-2 mt-3 gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFilesOpen(true)}
                  title="Ver Archivos"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    {quote.archivos?.length || 0}
                  </span>
                </button>

                <TableCellActions client={quote?.cliente as Client} actionType="notas" />
                <div style={{ marginLeft: -6 }}>
                  <TableCellActions
                    client={quote?.cliente as Client}
                    actionType="interacciones"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleEmail}
                  title="Enviar Email"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  title="Enviar WhatsApp"
                  className="text-muted-foreground hover:text-primary"
                >
                  <FaWhatsapp className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 font-semibold text-base whitespace-nowrap">
                <DollarSign className="h-4 w-4" />
                <span>{quote.montoTotal.toLocaleString("es-AR")}</span>
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
  highlight = false,
}: {
  id: string;
  etapa: Etapa;
  quotes: Cotizacion[];
  onDelete: (quoteId: string) => void;
  onUndo: (quoteId: string) => void;
  stageColors: StageColorMap;
  isFetching: boolean;
  highlight?: boolean;
}) {
  const quoteIds = useMemo(() => quotes.map((q) => q._id), [quotes]);
  const totalAmount = useMemo(
    () => quotes.reduce((sum, quote) => sum + quote.montoTotal, 0),
    [quotes],
  );

  const { setNodeRef, isOver } = useSortable({ id, data: { type: "Column" } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-80 h-full flex flex-col flex-shrink-0 rounded-lg bg-card shadow-sm transition-colors duration-300 border",
        isOver && "bg-primary/10",
        highlight && "border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-500/10",
        isOver && highlight && "bg-emerald-500/15",
      )}
    >
      {/* header de la columna */}
      <div className="p-3 pb-1 sticky top-0 bg-card/80 backdrop-blur-sm z-10 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: stageColors[etapa._id] || etapa.color }}
            />
            <h2 className="font-semibold text-base truncate">{etapa.nombre}</h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
            {quotes.length} Leads
          </span>
        </div>
        <div className="flex items-center gap-1 text-base font-bold">
          <DollarSign className="h-4 w-4" />
          <span>{totalAmount.toLocaleString("es-AR")}</span>
        </div>
      </div>

      {/* cards */}
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

      {/* Totales debajo de la columna */}
      <div className="border-t px-3 py-2 bg-muted/40 text-[11px] flex flex-col gap-1 rounded-b-lg">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Leads</span>
          <span className="font-semibold">{quotes.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">${totalAmount.toLocaleString("es-AR")}</span>
        </div>
      </div>
    </div>
  );
}

function QuotesTableView({
  quotes,
  onDelete,
  stageColors,
}: {
  quotes: Cotizacion[];
  onDelete: (quoteId: string) => void;
  stageColors: StageColorMap;
}) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotes.length > 0 ? (
            quotes.map((quote) => (
              <TableRow key={quote._id}>
                <TableCell className="font-medium">{quote.codigo}</TableCell>
                <TableCell>{quote.cliente.nombreCompleto}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: stageColors[quote.etapa._id] || quote.etapa.color,
                      }}
                    />
                    {quote.etapa.nombre}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ${quote.montoTotal.toLocaleString("es-AR")}
                </TableCell>
                <TableCell>{quote.vendedor.name}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onSelect={() => onDelete(quote._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No se encontraron cotizaciones con los filtros actuales.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function PipelineView({
  etapas,
  columns,
  onDelete,
  onUndo,
  sensors,
  onDragStart,
  onDragEnd,
  activeQuote,
  stageColors,
  isFetching,
}: PipelineViewProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex" style={{ height: "calc(100vh - 206px)" }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-4 h-full items-start overflow-x-auto w-full pb-2">
            <SortableContext items={etapas?.map((e: Etapa) => e._id) || []}>
              {etapas?.map((etapa: Etapa) => (
                <QuoteColumn
                  key={etapa._id}
                  id={etapa._id}
                  etapa={etapa}
                  quotes={columns[etapa._id] || []}
                  onDelete={onDelete}
                  onUndo={onUndo}
                  stageColors={stageColors}
                  isFetching={isFetching}
                  highlight={
                    etapa.nombre === "Proyecto por Iniciar" ||
                    etapa.nombre === "Proyectos no realizados" ||
                    etapa.nombre === "Proyecto Finalizado"
                  }
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
                      quote={activeQuote}
                      onDelete={() => {}}
                      stageColors={stageColors}
                      onUndo={onUndo}
                    />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </div>

      {/* Mobile: snap horizontal + ancho cómodo */}
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
                    id={etapa._id}
                    etapa={etapa}
                    quotes={columns[etapa._id] || []}
                    onDelete={onDelete}
                    onUndo={onUndo}
                    stageColors={stageColors}
                    isFetching={isFetching}
                    highlight={
                      etapa.nombre === "Proyecto por Iniciar" ||
                      etapa.nombre === "Proyectos no realizados" ||
                      etapa.nombre === "Proyecto Finalizado"
                    }
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
                      quote={activeQuote}
                      onDelete={() => {}}
                      stageColors={stageColors}
                      onUndo={onUndo}
                    />
                  </div>
                ) : null}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </div>
    </>
  );
}

export default function PipelinePage() {
  const [isStageFormModalOpen, setIsStageFormModalOpen] = useState(false);
  const [formFieldsForStage, setFormFieldsForStage] = useState<IFormField[]>([]);
  const [quoteToMove, setQuoteToMove] = useState<Cotizacion | null>(null);
  const [newStageId, setNewStageId] = useState<string | null>(null);

  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [columns, setColumns] = useState<Columns>({});
  const [activeQuote, setActiveQuote] = useState<Cotizacion | null>(null);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("pipeline");

  // ✅ Overlay bloqueante de movimiento
  const [isMoveBlocking, setIsMoveBlocking] = useState(false);
  const [moveBlockingLabel, setMoveBlockingLabel] = useState<string>("");

  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window === "undefined")
      return { searchTerm: "", vendedorId: "", dateRange: undefined };
    const savedFilters = localStorage.getItem("quotePipelineFilters");
    if (savedFilters) {
      const parsed = JSON.parse(savedFilters);
      if (parsed.dateRange?.from) parsed.dateRange.from = new Date(parsed.dateRange.from);
      if (parsed.dateRange?.to) parsed.dateRange.to = new Date(parsed.dateRange.to);
      return parsed;
    }
    return { searchTerm: "", vendedorId: "", dateRange: undefined };
  });

  const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

  useEffect(() => {
    if (session?.user?.id && !filters.vendedorId) {
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
      // columnas verdes especiales
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

  const queryKey = ["cotizacionesPipeline", debouncedSearchTerm, filters.vendedorId, filters.dateRange];

  const { data: cotizaciones, isLoading: isLoadingQuotes, isFetching } = useQuery<Cotizacion[]>({
    queryKey,
    queryFn: async () => {
      const params = {
        searchTerm: debouncedSearchTerm,
        vendedorId: filters.vendedorId,
        fechaDesde: filters.dateRange?.from?.toISOString(),
        fechaHasta: filters.dateRange?.to?.toISOString(),
      };
      const { data } = await axios.get("/api/cotizaciones", { params });
      return data.data;
    },
    enabled: !!etapas && !!filters.vendedorId,
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

  // ✅ Sensores más "mobile friendly"
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const updateQuoteStage = useMutation({
    mutationFn: (data: { quoteId: string; newStageId: string }) =>
      axios.put(`/api/cotizaciones/${data.quoteId}`, { etapa: data.newStageId }),
    onError: () => {
      toast.error("Error al cambiar la etapa.");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateQuoteWithFormData = useMutation({
    mutationFn: (data: { quoteId: string; newStageId: string; formData: Record<string, unknown> }) =>
      axios.put(`/api/cotizaciones/${data.quoteId}/move`, {
        etapa: data.newStageId,
        historial: data.formData,
      }),
    onSuccess: () => {
      toast.success("Cotización movida y actualizada con éxito.");
      queryClient.invalidateQueries({ queryKey: ["cotizacionesPipeline"] });
    },
    onError: () => {
      toast.error("Error al mover la cotización.");
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

  const deleteMutation = useMutation({
    mutationFn: (quoteId: string) => axios.delete(`/api/cotizaciones/${quoteId}`),
    onSuccess: () => {
      toast.success("Cotización eliminada con éxito.");
      queryClient.invalidateQueries({ queryKey });
      setQuoteToDelete(null);
    },
    onError: () => toast.error("Error al eliminar la cotización."),
  });

  function findContainer(id: string) {
    if (columns[id]) return id;
    return Object.keys(columns).find((key) => columns[key].some((item) => item._id === id));
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const quote = cotizaciones?.find((q) => q._id === active.id);
    if (quote) setActiveQuote(quote);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveQuote(null);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) {
      return;
    }

    // Movimiento entre columnas (cambio de etapa)
    if (activeContainer !== overContainer) {
      const quote = columns[activeContainer].find((q) => q._id === activeId);
      if (!quote) return;

      // ✅ Bloqueo mientras consultamos si hay formulario
      setMoveBlockingLabel("Verificando requisitos de la etapa...");
      setIsMoveBlocking(true);

      try {
        const { data } = await axios.get(`/api/formularios-etapa/${overContainer}`);
        const camposFormulario = data.data?.campos || [];

        // Hay formulario → abrimos modal (no movemos aún)
        if (camposFormulario.length > 0) {
          setFormFieldsForStage(camposFormulario);
          setQuoteToMove(quote);
          setNewStageId(overContainer);
          setIsStageFormModalOpen(true);
          setIsMoveBlocking(false);
          return;
        }

        // No hay formulario → mover directo
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
        if (nuevaEtapa) {
          movedItem.etapa = nuevaEtapa;
        }

        // Optimistic UI
        newDestItems.unshift(movedItem);
        setColumns((prev) => ({
          ...prev,
          [activeContainer]: newSourceItems,
          [overContainer]: newDestItems,
        }));

        try {
          await updateQuoteStage.mutateAsync({
            quoteId: activeId,
            newStageId: overContainer,
          });

          // Si la nueva etapa es "Proyecto por Iniciar", creamos Proyecto
          if (nuevaEtapa?.nombre === "Proyecto por Iniciar") {
            setMoveBlockingLabel("Creando proyecto...");
            try {
              await axios.post("/api/proyectos", {
                clienteId: movedItem.cliente._id,
                cotizacionId: movedItem._id,
                estadoActual: null,
              });

              toast.success(
                `Proyecto creado para ${movedItem.cliente?.nombreCompleto || "el cliente"}`,
              );
            } catch (error) {
              console.error("Error creando proyecto desde cotización", error);
              toast.error("Se movió la cotización pero no se pudo crear el proyecto.");
            }
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
        toast.error("Error al cargar el formulario de la etapa o al mover la cotización.");
        queryClient.invalidateQueries({ queryKey: ["cotizacionesPipeline"] });
        setIsMoveBlocking(false);
        setMoveBlockingLabel("");
      }
    } else {
      // Reordenar dentro de la misma columna
      const activeIndex = columns[activeContainer].findIndex((q) => q._id === activeId);
      const overIndex = columns[overContainer].findIndex((q) => q._id === overId);

      if (activeIndex !== overIndex) {
        const newOrderedQuotes = arrayMove(columns[overContainer], activeIndex, overIndex);
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

  if (isLoadingEtapas) {
    return (
      <div className="p-10 text-center flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-muted/20">
      {/* ✅ Overlay bloqueante */}
      <BlockingMoveOverlay show={isMoveBlocking} label={moveBlockingLabel} />

      {/* Header: más usable en mobile */}
      <div className="p-4 border-b flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Pipeline de Cotizaciones</h1>

          <div className="flex gap-2 w-full sm:w-auto">
            <CreateStageDialog />
            <CreateQuoteDialog />
          </div>
        </div>

        <StageFormModal
          isOpen={isStageFormModalOpen}
          onOpenChange={setIsStageFormModalOpen}
          title="Completa los datos para esta etapa"
          description="Agrega la información requerida antes de mover la cotización."
          formFields={formFieldsForStage}
          quoteId={quoteToMove?._id || ""}
          onSave={async (formData) => {
            if (!quoteToMove || !newStageId) return;

            const activeContainer = quoteToMove.etapa._id;
            const overContainer = newStageId;
            const quoteId = quoteToMove._id;

            const newEtapa = etapas?.find((e) => e._id === overContainer);
            const movedQuote: Cotizacion = {
              ...quoteToMove,
              etapa: newEtapa || quoteToMove.etapa,
            };

            // Optimistic UI
            setColumns((prev) => {
              const newPrev = { ...prev };
              const newSourceItems = newPrev[activeContainer].filter((q) => q._id !== quoteId);
              const newDestItems = [movedQuote, ...newPrev[overContainer]];
              return {
                ...newPrev,
                [activeContainer]: newSourceItems,
                [overContainer]: newDestItems,
              };
            });

            // ✅ Bloqueo durante el move con historial
            setMoveBlockingLabel("Moviendo cotización...");
            setIsMoveBlocking(true);

            try {
              await updateQuoteWithFormData.mutateAsync({
                quoteId: quoteToMove._id,
                newStageId,
                formData,
              });

              if (newEtapa?.nombre === "Proyecto por Iniciar") {
                setMoveBlockingLabel("Creando proyecto...");
                try {
                  await axios.post("/api/proyectos", {
                    clienteId: quoteToMove.cliente._id,
                    cotizacionId: quoteToMove._id,
                    estadoActual: null,
                  });
                  toast.success(
                    `Proyecto creado para ${quoteToMove.cliente?.nombreCompleto || "el cliente"}`,
                  );
                } catch (error) {
                  console.error("Error creando proyecto desde cotización", error);
                  toast.error("Se movió la cotización pero no se pudo crear el proyecto.");
                }
              }
            } finally {
              setIsMoveBlocking(false);
              setMoveBlockingLabel("");
              setQuoteToMove(null);
              setNewStageId(null);
            }
          }}
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center px-4 py-3 gap-3">
        <div className="flex-grow">
          <QuotesPipelineFilters filters={filters} setFilters={setFilters} />
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

      <div className="flex-grow overflow-auto px-4">
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
                onClick={() => deleteMutation.mutate(quoteToDelete!)}
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
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            activeQuote={activeQuote}
            stageColors={stageColors}
            isFetching={isFetching || isLoadingQuotes}
          />
        ) : (
          <QuotesTableView
            quotes={cotizaciones || []}
            onDelete={setQuoteToDelete}
            stageColors={stageColors}
          />
        )}
      </div>
    </div>
  );
}
