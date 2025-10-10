"use client";

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ViewNotesDialog } from '@/components/clientes/ViewNotesDialog';
import { ViewInteractionsDialog } from '@/components/clientes/ViewInteractionsDialog';
import { ViewQuoteFilesDialog } from '@/components/cotizaciones/ViewQuoteFilesDialog';
import { TableCellActions } from '../clientes/TableCellActions';
import { Client } from '@/types/client';
import { Loader2, DollarSign, MoreVertical, Trash2, Paperclip, Mail, LayoutGrid, Columns } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

type StageColorMap = { [key: string]: string };

interface Etapa { _id: string; nombre: string; color: string; }
export interface Cotizacion { 
    _id: string; 
    codigo: string; 
    montoTotal: number;
    detalle?: string;
    archivos: string[];
    etapa: Etapa; 
    cliente: { 
        _id: string;
        nombreCompleto: string;
        prioridad: 'Alta' | 'Media' | 'Baja';
    }; 
    vendedor: { name: string };
    historialEtapas: { etapa: Etapa }[];
}

function QuoteCard({ quote, onDelete, stageColors }: { quote: Cotizacion, onDelete: (quoteId: string) => void, stageColors: StageColorMap }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
        id: quote._id, 
        data: { type: 'Quote', quote }
    });
    const style = { 
        transform: CSS.Transform.toString(transform), 
        transition, 
        opacity: isDragging ? 0.4 : 1 
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
        const message = encodeURIComponent(`Hola ${quote.cliente?.nombreCompleto}, te escribo por la cotización ${quote.codigo}`);
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    };

    return (
        <>
            <ViewQuoteFilesDialog files={quote.archivos} quoteCode={quote.codigo} isOpen={isFilesOpen} onOpenChange={setFilesOpen} />
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                <Card className="mb-2 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing">
                    <CardContent >
                        {quote?.historialEtapas && (
                            <div className="flex gap-1 mb-1">
                                {quote.historialEtapas.map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: stageColors[h.etapa?._id] || "#ccc" }}
                                        title={`${h.etapa?.nombre}`}
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
                                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"> <MoreVertical className="h-4 w-4" /> </Button>
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
                            <p className="text-xs text-muted-foreground italic truncate">&quot;{quote.detalle || 'Sin detalle'}&quot;</p>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2 mt-2">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setFilesOpen(true)} title="Ver Archivos" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                                    <Paperclip className="h-4 w-4" /><span className="text-xs font-semibold">{quote.archivos?.length || 0}</span>
                                </button>
                                <TableCellActions client={quote?.cliente as Client} actionType="notas" />
                                <div style={{marginLeft: -6}}>
                                    <TableCellActions client={quote?.cliente as Client} actionType="interacciones" />
                                </div>
                                <button onClick={handleEmail} title="Enviar Email" className="text-muted-foreground hover:text-primary"> <Mail className="h-4 w-4" /> </button>
                                <button onClick={handleWhatsApp} title="Enviar WhatsApp" className="text-muted-foreground hover:text-primary"> <FaWhatsapp className="h-4 w-4" /> </button>
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