"use client";

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    closestCorners,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { useDebounce } from 'use-debounce';
import { useSession } from 'next-auth/react';
import { DateRange } from "react-day-picker";

import { Loader2, DollarSign, MoreVertical, Trash2, Paperclip, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { CreateQuoteDialog } from '@/components/cotizaciones/CreateQuoteDialog';
import { SortableContext, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuotesPipelineFilters, Filters } from '@/components/cotizaciones/QuotesPipelineFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ViewNotesDialog } from '@/components/clientes/ViewNotesDialog';
import { ViewInteractionsDialog } from '@/components/clientes/ViewInteractionsDialog';
import { ViewQuoteFilesDialog } from '@/components/cotizaciones/ViewQuoteFilesDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { FaWhatsapp } from 'react-icons/fa';
import { Mail } from 'lucide-react';

// --- Tipos de Datos ---
interface Etapa { _id: string; nombre: string; color: string; }
interface Cotizacion {
    historialEtapas: any; 
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
        prioridad: 'Alta' | 'Media' | 'Baja';
    }; 
    vendedor: { name: string };
}
type Columns = Record<string, Cotizacion[]>;

// --- Componente: Tarjeta de Cotización ---
function QuoteCard({ quote, onDelete }: { quote: Cotizacion, onDelete: (quoteId: string) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
        id: quote._id, 
        data: { type: 'Quote', quote }
    });
    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        opacity: isDragging ? 0.4 : 1 
    };
    
    const [isNotesOpen, setNotesOpen] = useState(false);
    const [isInteractionsOpen, setInteractionsOpen] = useState(false);
    const [isFilesOpen, setFilesOpen] = useState(false);

    const prioridadStyles: Record<string, string> = {
        Alta: "bg-red-500/20 text-red-700 border-red-500/50",
        Media: "bg-yellow-500/20 text-yellow-700 border-yellow-500/50",
        Baja: "bg-blue-500/20 text-blue-700 border-blue-500/50",
    };

    // CTA handlers
    const handleEmail = () => {
        if (quote.cliente?.nombreCompleto) {
            window.location.href = `mailto:?subject=Cotización ${quote.codigo}&body=Hola ${quote.cliente.nombreCompleto}, ...`;
        }
    };

    const handleWhatsApp = () => {
        const phone = "5491111111111"; // <- reemplazar con el teléfono real del cliente si lo guardás en BD
        const message = encodeURIComponent(`Hola ${quote.cliente?.nombreCompleto}, te escribo por la cotización ${quote.codigo}`);
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    };

    return (
        <>
            <ViewNotesDialog client={quote.cliente as any} isOpen={isNotesOpen} onOpenChange={setNotesOpen} />
            <ViewInteractionsDialog client={quote.cliente as any} isOpen={isInteractionsOpen} onOpenChange={setInteractionsOpen} />
            <ViewQuoteFilesDialog files={quote.archivos} quoteCode={quote.codigo} isOpen={isFilesOpen} onOpenChange={setFilesOpen} />

            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <Card className="mb-2 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing">
                    <CardContent className="space-y-2">

                        {/* --- Historial de etapas --- */}
                        {quote?.historialEtapas && (
                            <div className="flex gap-1 mb-1">
                                {quote?.historialEtapas.map((h: any, i: number) => (
                                    <div
                                        key={i}
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: h.etapa?.color || "#ccc" }}
                                        title={`${h.etapa?.nombre} - ${new Date(h.fecha).toLocaleDateString("es-AR")}`}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-bold">{quote.codigo} <Badge variant="outline" className={`mt-1 text-xs ml-1 ${prioridadStyles[quote.cliente.prioridad] || ''}`}>
                                    {quote.cliente.prioridad}
                                </Badge></p>
                                
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => onDelete(quote._id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <div>
                            <p className="text-sm font-semibold">{quote.cliente.nombreCompleto}</p>
                            <p className="text-xs text-muted-foreground italic truncate">"{quote.detalle || 'Sin detalle'}"</p>
                        </div>

                        <div className="flex items-center justify-between border-t pt-2 mt-2">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setFilesOpen(true)} title="Ver Archivos" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                                    <Paperclip className="h-4 w-4" /><span className="text-xs font-semibold">{quote.archivos?.length || 0}</span>
                                </button>
                                <button onClick={() => setNotesOpen(true)} title="Ver Notas" className="text-muted-foreground hover:text-primary">
                                    <FileText className="h-4 w-4" />
                                </button>
                                <button onClick={() => setInteractionsOpen(true)} title="Ver Interacciones" className="text-muted-foreground hover:text-primary">
                                    <MessageSquare className="h-4 w-4" />
                                </button>

                                {/* --- CTA Email y WhatsApp --- */}
                                <button onClick={handleEmail} title="Enviar Email" className="text-muted-foreground hover:text-primary">
                                    <Mail className="h-4 w-4" />
                                </button>
                                <button onClick={handleWhatsApp} title="Enviar WhatsApp" className="text-muted-foreground hover:text-primary">
                                    <FaWhatsapp className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-base">
                                <DollarSign className="h-4 w-4" />
                                <span>{quote.montoTotal.toLocaleString('es-AR')}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

// --- Componente: Columna del Pipeline ---
function QuoteColumn({ id, etapa, quotes, onDelete }: { id: string; etapa: Etapa; quotes: Cotizacion[], onDelete: (quoteId: string) => void; }) {
    const quoteIds = useMemo(() => quotes.map(q => q._id), [quotes]);
    const totalAmount = useMemo(() => quotes.reduce((sum, quote) => sum + quote.montoTotal, 0), [quotes]);
    const { setNodeRef, isOver } = useSortable({ id, data: { type: 'Column' } });
    return (
        <div ref={setNodeRef} className={cn("w-80 h-full flex flex-col flex-shrink-0 rounded-lg bg-card shadow-sm transition-colors duration-300", isOver ? "bg-primary/10" : "border")}>
            <div className="p-3 pb-1 sticky top-0 bg-card/80 backdrop-blur-sm z-10 rounded-t-lg">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: etapa.color }}></div>
                        <h2 className="font-semibold text-base">{etapa.nombre}</h2>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">{quotes.length} Leads</span>
                </div>
                <div className="flex items-center gap-1 text-x font-bold">
                    <DollarSign className="h-4 w-4" /><span >{totalAmount.toLocaleString('es-AR')}</span>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-2">
                <SortableContext items={quoteIds}>
                    {quotes.map(quote => <QuoteCard key={quote._id} quote={quote} onDelete={onDelete} />)}
                </SortableContext>
                {quotes.length === 0 && <div className="flex items-center justify-center h-full"><p className="text-center text-sm text-muted-foreground p-4 italic">Arrastra una cotización aquí</p></div>}
            </div>
        </div>
    );
}

// --- Componente Principal de la Página ---
export default function PipelinePage() {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const [columns, setColumns] = useState<Columns>({});
    const [activeQuote, setActiveQuote] = useState<Cotizacion | null>(null);
    const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);

    const [filters, setFilters] = useState<Filters>(() => {
        if (typeof window === 'undefined') return { searchTerm: '', vendedorId: '', dateRange: undefined };
        const savedFilters = localStorage.getItem('quotePipelineFilters');
        if (savedFilters) {
            const parsed = JSON.parse(savedFilters);
            if (parsed.dateRange?.from) parsed.dateRange.from = new Date(parsed.dateRange.from);
            if (parsed.dateRange?.to) parsed.dateRange.to = new Date(parsed.dateRange.to);
            return parsed;
        }
        return { searchTerm: '', vendedorId: '', dateRange: undefined };
    });

    const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

    useEffect(() => {
        if (session?.user?.id && !filters.vendedorId) {
            setFilters(prev => ({...prev, vendedorId: session.user.id as string}));
        }
    }, [session, filters.vendedorId]);

    useEffect(() => {
        localStorage.setItem('quotePipelineFilters', JSON.stringify(filters));
    }, [filters]);

    const { data: etapas, isLoading: isLoadingEtapas } = useQuery<Etapa[]>({
        queryKey: ['etapasCotizacion'],
        queryFn: async () => (await axios.get('/api/etapas-cotizacion')).data.data,
    });

    const queryKey = ['cotizacionesPipeline', debouncedSearchTerm, filters.vendedorId, filters.dateRange];
    const { data: cotizaciones, isLoading: isLoadingQuotes, isFetching } = useQuery<Cotizacion[]>({
        queryKey,
        queryFn: async () => {
            const params = {
                searchTerm: debouncedSearchTerm,
                vendedorId: filters.vendedorId,
                fechaDesde: filters.dateRange?.from?.toISOString(),
                fechaHasta: filters.dateRange?.to?.toISOString(),
            };
            const { data } = await axios.get('/api/cotizaciones', { params });
            return data.data;
        },
        enabled: !!etapas && !!filters.vendedorId,
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (etapas && cotizaciones) {
            const initialColumns: Columns = {};
            etapas.forEach(etapa => initialColumns[etapa._id] = []);
            cotizaciones.forEach(quote => {
                const stageId = quote.etapa?._id;
                if (stageId && initialColumns[stageId]) {
                    initialColumns[stageId].push(quote);
                }
            });
            setColumns(initialColumns);
        }
    }, [etapas, cotizaciones]);
    
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

    const updateQuoteStage = useMutation({
        mutationFn: (data: { quoteId: string; newStageId: string }) => axios.put(`/api/cotizaciones/${data.quoteId}`, { etapa: data.newStageId }),
        onError: () => {
            toast.error(`Error al cambiar la etapa.`);
            queryClient.invalidateQueries({ queryKey });
        },
    });

    const reorderQuotesMutation = useMutation({
        mutationFn: (data: { stageId: string; orderedQuoteIds: string[] }) => 
            axios.put(`/api/cotizaciones/reorder`, data),
        onError: () => {
            toast.error(`Error al guardar el nuevo orden.`);
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
        onError: () => toast.error("Error al eliminar la cotización.")
    });
    
    function findContainer(id: string) {
        if (columns[id]) return id;
        return Object.keys(columns).find(key => columns[key].some(item => item._id === id));
    }

    function handleDragStart(event: DragStartEvent) {
        const { active } = event;
        const quote = cotizaciones?.find(q => q._id === active.id);
        if (quote) setActiveQuote(quote);
    }
    
    function handleDragEnd(event: DragEndEvent) {
        setActiveQuote(null);
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();
        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;
        
        const activeIndex = columns[activeContainer].findIndex(q => q._id === activeId);
        const overSortable = over.data.current?.type === 'Quote' || over.data.current?.type === 'Column';
        const overIndex = overSortable
            ? columns[overContainer].findIndex(q => q._id === overId) !== -1 
                ? columns[overContainer].findIndex(q => q._id === overId) 
                : columns[overContainer].length
            : 0;

        if (activeContainer !== overContainer) {
            let newSourceItems = [...columns[activeContainer]];
            let newDestItems = [...columns[overContainer]];
            const [movedItem] = newSourceItems.splice(activeIndex, 1);
            newDestItems.splice(overIndex, 0, movedItem);

            setColumns(prev => ({
                ...prev,
                [activeContainer]: newSourceItems,
                [overContainer]: newDestItems,
            }));

            updateQuoteStage.mutate({ quoteId: activeId, newStageId: overContainer });
            reorderQuotesMutation.mutate({ stageId: activeContainer, orderedQuoteIds: newSourceItems.map(q => q._id) });
            reorderQuotesMutation.mutate({ stageId: overContainer, orderedQuoteIds: newDestItems.map(q => q._id) });
        } else {
          if (activeIndex !== overIndex) {
            const newOrderedQuotes = arrayMove(columns[overContainer], activeIndex, overIndex);
            setColumns(prev => ({ ...prev, [overContainer]: newOrderedQuotes }));
            const orderedQuoteIds = newOrderedQuotes.map(q => q._id);
            reorderQuotesMutation.mutate({ stageId: overContainer, orderedQuoteIds });
          }
        }
    }

    if (isLoadingEtapas || !session) {
        return <div className="p-10 text-center flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }
    
    return (
        <div className="h-screen flex flex-col">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-card">
                <h1 className="text-3xl font-bold">Pipeline de Cotizaciones</h1>
                <CreateQuoteDialog />
            </div>
            
            <QuotesPipelineFilters filters={filters} setFilters={setFilters} />

            {(isLoadingQuotes && !isFetching) ? (
                <div className="flex-grow p-10 text-center flex justify-center items-center"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : (
                <div className="flex-grow overflow-hidden">
                    <AlertDialog open={!!quoteToDelete} onOpenChange={() => setQuoteToDelete(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará la cotización permanentemente.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(quoteToDelete!)} className="bg-red-600 hover:bg-red-700">Sí, eliminar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* --- VISTA DE ESCRITORIO (con Drag and Drop) --- */}
                    <div className="hidden md:flex h-full">
                        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <div className="flex gap-4 p-4 pt-0 h-full items-start overflow-x-auto w-full">
                                <SortableContext items={etapas?.map(e => e._id) || []}>
                                    {etapas?.map(etapa => (
                                        <QuoteColumn key={etapa._id} id={etapa._id} etapa={etapa} quotes={columns[etapa._id] || []} onDelete={setQuoteToDelete} />
                                    ))}
                                </SortableContext>
                            </div>
                            {typeof document !== 'undefined' && createPortal(
                                <DragOverlay>
                                    {activeQuote ? <div className="w-80 scale-105 opacity-95 shadow-2xl"><QuoteCard quote={activeQuote} onDelete={() => {}} /></div> : null}
                                </DragOverlay>,
                                document.body
                            )}
                        </DndContext>
                    </div>

                    {/* --- VISTA MÓVIL (con Pestañas) --- */}
                    <div className="md:hidden p-2 flex-grow overflow-hidden">
                        <Tabs defaultValue={etapas?.[0]?._id} className="h-full flex flex-col">
                            <TabsList className="w-full overflow-x-auto justify-start">
                                {etapas?.map(etapa => (
                                    <TabsTrigger key={etapa._id} value={etapa._id}>
                                        {etapa.nombre} ({columns[etapa._id]?.length || 0})
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="flex-grow overflow-y-auto mt-2">
                                {etapas?.map(etapa => (
                                    <TabsContent key={etapa._id} value={etapa._id} className="mt-0">
                                        {(columns[etapa._id] || []).length > 0 ? (
                                            (columns[etapa._id] || []).map(quote => 
                                                // El componente QuoteCard no es arrastrable en móvil, solo informativo
                                                <div key={quote._id}>
                                                    <QuoteCard quote={quote} onDelete={setQuoteToDelete}/>
                                                </div>
                                            )
                                        ) : (
                                            <p className="text-center text-muted-foreground p-8 italic">No hay cotizaciones en esta etapa.</p>
                                        )}
                                    </TabsContent>
                                ))}
                            </div>
                        </Tabs>
                    </div>
                </div>
            )}
        </div>
    );
}