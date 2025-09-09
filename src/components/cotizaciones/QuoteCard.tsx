"use client";

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, DollarSign, User, FileText, MessageSquare, Paperclip, Trash2 } from "lucide-react";
import { ViewNotesDialog } from '@/components/clientes/ViewNotesDialog';
import { ViewInteractionsDialog } from '@/components/clientes/ViewInteractionsDialog';
import { ViewQuoteFilesDialog } from '@/components/cotizaciones/ViewQuoteFilesDialog';

// Tipos
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

export function QuoteCard({ quote, onDelete }: { quote: Cotizacion, onDelete: (quoteId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: quote._id, data: { quote } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  
  const [isNotesOpen, setNotesOpen] = useState(false);
  const [isInteractionsOpen, setInteractionsOpen] = useState(false);
  const [isFilesOpen, setFilesOpen] = useState(false);

  const prioridadStyles: Record<string, string> = {
    Alta: "bg-red-500/20 text-red-700 border-red-500/50",
    Media: "bg-yellow-500/20 text-yellow-700 border-yellow-500/50",
    Baja: "bg-blue-500/20 text-blue-700 border-blue-500/50",
  };

  return (
    <>
      <ViewNotesDialog client={quote.cliente as any} isOpen={isNotesOpen} onOpenChange={setNotesOpen} />
      <ViewInteractionsDialog client={quote.cliente as any} isOpen={isInteractionsOpen} onOpenChange={setInteractionsOpen} />
      <ViewQuoteFilesDialog files={quote.archivos} quoteCode={quote.codigo} isOpen={isFilesOpen} onOpenChange={setFilesOpen} />

      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card className="mb-2 shadow-sm hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-2 space-y-2">
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-2 px-2 border-b border-dashed border-gray-200">
              {quote.historialEtapas?.filter(h => h.etapa).map((hist, index) => (
                  <div 
                    key={index} 
                    className="h-2 w-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: hist.etapa.color || '#ccc' }} 
                    title={hist.etapa.nombre} 
                  />
                ))}
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold">{quote.codigo}</p>
                <Badge variant="outline" className={`mt-1 text-xs ${prioridadStyles[quote.cliente.prioridad] || ''}`}>
                  {quote.cliente.prioridad}
                </Badge>
              </div>
              <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
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
              <div className="flex items-center gap-2">
                <button onClick={() => setFilesOpen(true)} title="Ver Archivos" className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                  <Paperclip className="h-4 w-4" /><span className="text-xs font-semibold">{quote.archivos?.length || 0}</span>
                </button>
                <button onClick={() => setNotesOpen(true)} title="Ver Notas" className="text-muted-foreground hover:text-primary"><FileText className="h-4 w-4" /></button>
                <button onClick={() => setInteractionsOpen(true)} title="Ver Interacciones" className="text-muted-foreground hover:text-primary"><MessageSquare className="h-4 w-4" /></button>
              </div>
              <div className="flex items-center gap-1 font-semibold text-base">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span>{quote.montoTotal.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}