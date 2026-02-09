"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

type Stage = { nombre?: string };

type QuoteHistoryItem = {
  etapa?: Stage;
  fecha?: string; // o Date si tu API devuelve Date serializada distinto
};

type QuoteDetails = {
  codigo?: string;
  detalle?: string;
  montoTotal?: number;
  cliente?: { nombreCompleto?: string };
  etapa?: Stage;
  vendedor?: { name?: string };
  historialEtapas?: QuoteHistoryItem[];
};

export function QuoteDetailsDialog({
  open,
  onOpenChange,
  quoteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quoteId: string | null;
}) {
  const enabled = open && !!quoteId;

  const { data, isLoading } = useQuery<QuoteDetails>({
    queryKey: ["cotizacion", quoteId],
    enabled,
    queryFn: async () => (await axios.get(`/api/cotizaciones/${quoteId}`)).data.data,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del negocio</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !data ? (
          <div className="text-sm text-muted-foreground">No se encontró la cotización.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-semibold">{data.cliente?.nombreCompleto}</div>
              <div className="text-xs text-muted-foreground">Código: {data.codigo}</div>
              <div className="text-xs text-muted-foreground">Etapa: {data.etapa?.nombre}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground mb-1">Monto</div>
                <div className="text-base font-semibold">
                  ${Number(data.montoTotal || 0).toLocaleString("es-AR")}
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground mb-1">Vendedor</div>
                <div className="text-sm font-medium">{data.vendedor?.name || "—"}</div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground mb-2">Detalle</div>
              <div className="text-sm whitespace-pre-wrap">{data.detalle || "—"}</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-xs text-muted-foreground mb-2">Historial</div>
              <div className="space-y-2">
                {(data.historialEtapas ?? []).map((h: QuoteHistoryItem, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{h.etapa?.nombre || "—"}</span>
                    <span className="text-xs text-muted-foreground">
                      {h.fecha ? new Date(h.fecha).toLocaleString("es-AR") : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
