// src/components/cotizaciones/QuoteDetailsSheet.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Mail, Paperclip, Copy, ExternalLink, Phone, User2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { TableCellActions } from "@/components/clientes/TableCellActions";
import { Client } from "@/types/client";
import { ViewQuoteFilesDialog } from "@/components/cotizaciones/ViewQuoteFilesDialog";

function prettifyKey(key: string) {
  return key
    .replace(/^__/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function renderValue(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function fmtDate(d?: string) {
  return d
    ? new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
    : "—";
}

function money(n: unknown) {
  const val = typeof n === "number" ? n : Number(n || 0);
  return `$${(Number.isFinite(val) ? val : 0).toLocaleString("es-AR")}`;
}

/**
 * Normaliza teléfono para WA.
 * - Quita todo lo que no sea dígito
 * - Si no arranca con código país, podés adaptar tu regla.
 *   Por defecto: si no empieza con "54", se lo antepone.
 */
function normalizePhoneForWA(raw?: string) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // Heurística Argentina:
  // Si ya empieza con 54 -> ok
  // Si empieza con 0... o 11..., anteponemos 54
  if (digits.startsWith("54")) return digits;

  // Si viene "011..." o "0..."
  const cleaned = digits.replace(/^0+/, "");
  if (cleaned.startsWith("54")) return cleaned;

  return `54${cleaned}`;
}

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
            className="h-9 w-9"
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

function KeyValueRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-1.5">
      <div className="text-[12px] text-muted-foreground">{k}</div>
      <div className="text-[13px] font-medium text-right sm:text-left break-words">{v}</div>
    </div>
  );
}

export function QuoteDetailsSheet({
  open,
  onOpenChange,
  quoteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quoteId: string | null;
}) {
  const [isFilesOpen, setFilesOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["cotizacionDetalle", quoteId],
    queryFn: async () => {
      const res = await axios.get(`/api/cotizaciones/${quoteId}`);
      return res.data.data;
    },
    enabled: open && !!quoteId,
  });

  const quote = data;

  const clienteNombre = quote?.cliente?.nombreCompleto || "—";
  const clienteEmail = quote?.cliente?.email || "";
  const clienteTelefono = quote?.cliente?.telefono || "";

  const waPhone = useMemo(() => normalizePhoneForWA(clienteTelefono) || "5491111111111", [clienteTelefono]);

  const waMessage = useMemo(() => {
    const msg = `Hola ${clienteNombre}, te escribo por la cotización ${quote?.codigo || ""}.`;
    return encodeURIComponent(msg);
  }, [clienteNombre, quote?.codigo]);

  const handleEmail = () => {
    // Usa email del cliente si existe
    const to = clienteEmail ? `${encodeURIComponent(clienteEmail)}` : "";
    const subject = encodeURIComponent(`Cotización ${quote?.codigo || ""}`);
    const body = encodeURIComponent(`Hola ${clienteNombre},\n\nTe escribo por la cotización ${quote?.codigo || ""}.\n\nSaludos.`);
    // mailto:<to>?subject=...&body=...
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/${waPhone}?text=${waMessage}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback silencioso: si no hay permisos, no rompemos UI
    }
  };

  const history = Array.isArray(quote?.historialEtapas) ? quote.historialEtapas : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        {/* Archivos dialog */}
        <ViewQuoteFilesDialog
          files={quote?.archivos || []}
          quoteCode={quote?.codigo || ""}
          isOpen={isFilesOpen}
          onOpenChange={setFilesOpen}
        />

        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b">
          <SheetHeader className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <SheetTitle className="text-base sm:text-lg">
                  {isLoading ? "Cargando…" : `Cotización ${quote?.codigo || ""}`}
                </SheetTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="font-medium">
                    {quote?.etapa?.nombre || "Sin etapa"}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">
                    {clienteNombre}
                  </span>
                </div>
              </div>

              {/* CTAs compactos */}
              <div className="flex items-center gap-2">
                <IconCta
                  label="Enviar email"
                  onClick={handleEmail}
                  disabled={!quote}
                >
                  <Mail className="h-4 w-4" />
                </IconCta>

                <IconCta
                  label="Enviar WhatsApp"
                  onClick={handleWhatsApp}
                  disabled={!quote}
                >
                  <FaWhatsapp className="h-4 w-4" />
                </IconCta>

                <IconCta
                  label={`Archivos (${quote?.archivos?.length || 0})`}
                  onClick={() => setFilesOpen(true)}
                  disabled={!quote}
                >
                  <Paperclip className="h-4 w-4" />
                </IconCta>

                {/* Notas / Interacciones como CTAs (si querés, después los pasamos a icon-only también) */}
                {quote?.cliente ? (
                  <>
                    <TableCellActions client={quote.cliente as Client} actionType="notas" />
                    <TableCellActions client={quote.cliente as Client} actionType="interacciones" />
                  </>
                ) : null}
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 88px)" }}>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !quote ? (
            <div className="text-sm text-muted-foreground">No se encontró la cotización.</div>
          ) : (
            <>
              {/* Resumen */}
              <Card className="p-4">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Monto total</div>
                    <div className="text-xl font-semibold">{money(quote.montoTotal)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Vendedor: <span className="font-medium text-foreground">{quote.vendedor?.name || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy(String(quote.codigo || ""))}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" /> Copiar código
                    </Button>
                  </div>
                </div>

                {quote.detalle ? (
                  <>
                    <Separator className="my-3" />
                    <div className="text-xs text-muted-foreground mb-1">Detalle</div>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap leading-relaxed">
                      {quote.detalle}
                    </div>
                  </>
                ) : null}
              </Card>

              {/* Datos de la cotización */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Datos de la cotización</div>
                </div>
                <Separator className="my-3" />

                <div className="divide-y">
                  <KeyValueRow
                    k="Código"
                    v={
                      <div className="flex items-center justify-end sm:justify-start gap-2">
                        <span>{quote.codigo}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(String(quote.codigo || ""))}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    }
                  />
                  <KeyValueRow k="Etapa" v={quote.etapa?.nombre || "—"} />
                  <KeyValueRow k="Monto" v={money(quote.montoTotal)} />
                  <KeyValueRow k="Creada" v={fmtDate(quote.createdAt)} />
                  <KeyValueRow k="Actualizada" v={fmtDate(quote.updatedAt)} />
                </div>
              </Card>

              {/* Cliente */}
              <Card className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm font-semibold">Cliente</div>
                  </div>

                  {quote.cliente?._id ? (
                    <Link
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      href={`/dashboard/listados/${quote.cliente._id}`}
                    >
                      Ver ficha <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                </div>

                <Separator className="my-3" />

                <div className="divide-y">
                  <KeyValueRow k="Nombre" v={clienteNombre} />

                  <KeyValueRow
                    k="Teléfono"
                    v={
                      <div className="flex items-center justify-end sm:justify-start gap-2">
                        <span>{clienteTelefono || "—"}</span>
                        {clienteTelefono ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(clienteTelefono)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => window.open(`tel:${clienteTelefono}`, "_self")}
                              title="Llamar"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    }
                  />

                  <KeyValueRow
                    k="Email"
                    v={
                      <div className="flex items-center justify-end sm:justify-start gap-2">
                        <span className="break-all">{clienteEmail || "—"}</span>
                        {clienteEmail ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(clienteEmail)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    }
                  />
                </div>
              </Card>

              {/* Historial */}
              <Card className="p-4">
                <div className="text-sm font-semibold">Historial y formularios</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Últimos movimientos y datos cargados en cada etapa.
                </div>

                <Separator className="my-3" />

                {history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin historial.</div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {history
                      .slice()
                      .reverse()
                      .map((h: any, idx: number) => {
                        const df = h?.datosFormulario || {};
                        const entries = Object.entries(df).filter(
                          ([k]) => k !== "__precioAnterior" && k !== "__precioNuevo"
                        );

                        const title = h?.etapa?.nombre || "Etapa";
                        const when = fmtDate(h?.fecha);

                        return (
                          <AccordionItem key={`${title}-${idx}`} value={`${idx}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex w-full items-center justify-between gap-3 pr-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{title}</div>
                                  <div className="text-xs text-muted-foreground">{when}</div>
                                </div>

                                <Badge variant="outline" className="shrink-0">
                                  {entries.length ? `${entries.length} campos` : "Sin datos"}
                                </Badge>
                              </div>
                            </AccordionTrigger>

                            <AccordionContent>
                              {entries.length === 0 ? (
                                <div className="text-sm text-muted-foreground py-2">
                                  Sin datos de formulario para esta etapa.
                                </div>
                              ) : (
                                <div className="rounded-md border bg-muted/20 p-3">
                                  <div className="space-y-2">
                                    {entries.map(([k, v]) => (
                                      <div
                                        key={k}
                                        className="grid grid-cols-[1fr_1fr] gap-3 items-start"
                                      >
                                        <div className="text-[12px] text-muted-foreground">
                                          {prettifyKey(k)}
                                        </div>
                                        <div className="text-[13px] font-medium text-right break-words">
                                          {renderValue(v)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>
                )}
              </Card>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
