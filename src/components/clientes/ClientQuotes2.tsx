"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { DollarSign, FileText, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ... (Interfaces sin cambios)
interface Etapa {
  _id: string;
  nombre: string;
}

interface HistorialEtapa {
  etapa: Etapa | null; // <-- Técnicamente, puede ser null después del populate
  fecha: string;
  _id: string;
}

interface Cotizacion {
  _id: string;
  codigo: string;
  montoTotal: number;
  etapa: Etapa;
  historialEtapas: HistorialEtapa[];
  createdAt: string;
}


export function ClientQuotes2({ clientId }: { clientId: string }) {
  const { data: cotizaciones, isLoading } = useQuery<Cotizacion[]>({
    queryKey: ['cotizacionesCliente', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${clientId}/cotizaciones`);
      return data.data;
    },
    enabled: !!clientId,
  });

  if (isLoading) return <div>Cargando cotizaciones...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <FileText className="h-6 w-6" />
        Cotizaciones Asociadas
      </h2>
      {cotizaciones && cotizaciones.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {cotizaciones.map((cotizacion) => (
            <AccordionItem value={cotizacion._id} key={cotizacion._id}>
              <AccordionTrigger>
                <div className="flex justify-between items-center w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">{cotizacion.codigo}</span>
                    <Badge variant="outline">{cotizacion.etapa?.nombre || 'N/A'}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <DollarSign className="h-4 w-4"/>
                    {cotizacion.montoTotal.toLocaleString('es-AR')}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                    <History className="h-4 w-4" />
                    Historial de Etapas de la Cotización
                  </h4>
                  <div className="space-y-6 border-l-2 border-border pl-6 relative">
                    {cotizacion.historialEtapas?.map((hist, index) => (
                      <div key={index} className="relative">
                        <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full bg-blue-500" />
                        {/* ✅ SOLUCIÓN APLICADA AQUÍ */}
                        <p className="font-semibold">{hist.etapa?.nombre || 'Etapa Eliminada'}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(hist.fecha), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-muted-foreground">No hay cotizaciones para este cliente.</p>
      )}
    </div>
  );
}