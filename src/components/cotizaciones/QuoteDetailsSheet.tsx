"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

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

import {
  Mail,
  Paperclip,
  Copy,
  ExternalLink,
  Phone,
  User2,
  Pencil,
  Check,
  X,
  Receipt,
  CreditCard,
  Image as ImageIcon,
  Boxes,
  LifeBuoy,
  Activity,
  Download,
  Trash2,
  Upload,
  Plus,
  Lock,
  Crown,
  Hash,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { TableCellActions } from "@/components/clientes/TableCellActions";
import { Client } from "@/types/client";

// -------------------- Types --------------------
type Stage = { _id?: string; nombre?: string; color?: string };

type QuoteHistoryItem = {
  etapa?: Stage;
  fecha?: string;
  datosFormulario?: Record<string, unknown>;
};

type QuoteArchivo = {
  uid: string;
  url: string;
  publicId?: string;
  name?: string;
  createdAt?: string;
};

type QuoteFactura = {
  uid: string;
  numero?: string;
  fecha?: string;
  monto?: number;
  estado?: "pendiente" | "pagada" | "vencida" | "anulada";
  url?: string; // pdf o imagen
};

type QuotePago = {
  uid: string;
  fecha?: string;
  monto?: number;
  metodo?: string;
  referencia?: string;
  comprobanteUrl?: string; // ✅ solo imagen
};

type QuoteImagen = {
  uid: string;
  url: string;
  caption?: string;
};

type QuoteMaterialPedido = {
  uid: string;
  descripcion: string;
  cantidad?: number;
  unidad?: string;
  estado?: "pendiente" | "pedido" | "recibido" | "cancelado";
};

type QuoteTicket = {
  uid: string;
  titulo: string;
  estado?: "abierto" | "en_progreso" | "cerrado";
  createdAt?: string;
  descripcion?: string;
  url?: string;
};

type QuoteDetails = {
  _id: string;
  codigo?: string;
  nombre?: string;
  montoTotal?: number;
  detalle?: string;

  archivos?: Array<QuoteArchivo | string>; // legacy compat

  cliente?: Client & { email?: string };
  vendedor?: { _id?: string; name?: string; email?: string };
  etapa?: Stage;

  createdAt?: string;
  updatedAt?: string;

  historialEtapas?: QuoteHistoryItem[];

  facturas?: QuoteFactura[];
  pagos?: QuotePago[];
  imagenes?: QuoteImagen[];
  materialPedido?: QuoteMaterialPedido[];
  tickets?: QuoteTicket[];
};

type PutOps =
  | { op: "setNombre"; nombre: string }
  | { op: "setCodigo"; codigo: string }
  | { op: "appendArchivos"; archivos: QuoteArchivo[] }
  | { op: "removeArchivo"; uid: string }
  | { op: "addFactura"; factura: QuoteFactura }
  | { op: "removeFactura"; uid: string }
  | { op: "addPago"; pago: QuotePago }
  | { op: "removePago"; uid: string }
  | { op: "addImagen"; imagen: QuoteImagen }
  | { op: "removeImagen"; uid: string }
  | { op: "addMaterial"; material: QuoteMaterialPedido }
  | { op: "removeMaterial"; uid: string }
  | { op: "addTicket"; ticket: QuoteTicket }
  | { op: "removeTicket"; uid: string };

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function prettifyKey(key: string) {
  return key
    .replace(/^__/, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2") // PrecioNuevo -> Precio Nuevo
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isMoneyKey(k: string) {
  const t = k.toLowerCase();
  return t.includes("precio") || t.includes("monto") || t.includes("total") || t.includes("importe");
}

function renderValueWithKey(k: string, v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Sí" : "No";

  if (typeof v === "number" && isMoneyKey(k)) return money(v);
  if (typeof v === "string" && isMoneyKey(k)) {
    const n = Number(v);
    if (Number.isFinite(n)) return money(n);
  }
  return String(v);
}

function fmtDate(d?: string) {
  return d
    ? new Date(d).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })
    : "—";
}

function money(n: unknown) {
  const val = typeof n === "number" ? n : Number(n || 0);
  return `$${(Number.isFinite(val) ? val : 0).toLocaleString("es-AR")}`;
}

function normalizePhoneForWA(raw?: string) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) return digits;
  const cleaned = digits.replace(/^0+/, "");
  if (cleaned.startsWith("54")) return cleaned;
  return `54${cleaned}`;
}

function fileNameFromUrl(u: string) {
  try {
    const parts = u.split("/");
    return parts[parts.length - 1] || "archivo";
  } catch {
    return "archivo";
  }
}

function normalizeArchivos(raw?: Array<QuoteArchivo | string>): QuoteArchivo[] {
  if (!raw) return [];
  return raw
    .map((a) => {
      if (typeof a === "string") {
        return { uid: `legacy-${a}`, url: a, name: fileNameFromUrl(a) } satisfies QuoteArchivo;
      }
      return a;
    })
    .filter(Boolean);
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
            className="h-9 w-9 rounded-xl border-border/60 bg-background/60 backdrop-blur hover:bg-background shadow-sm"
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

export function QuoteDetailsSheet({
  open,
  onOpenChange,
  quoteId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  quoteId: string | null;
}) {
  const queryClient = useQueryClient();

  const attachmentsInputRef = useRef<HTMLInputElement | null>(null);
  const facturaInputRef = useRef<HTMLInputElement | null>(null);
  const pagoInputRef = useRef<HTMLInputElement | null>(null);
  const imagenesInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [isEditingCode, setIsEditingCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");

  const [facturaDraft, setFacturaDraft] = useState<{
    numero: string;
    fecha: string;
    monto: string;
    estado: QuoteFactura["estado"];
    url: string;
  }>({ numero: "", fecha: "", monto: "", estado: "pendiente", url: "" });

  const [pagoDraft, setPagoDraft] = useState<{
    fecha: string;
    monto: string;
    metodo: string;
    referencia: string;
    comprobanteUrl: string;
  }>({ fecha: "", monto: "", metodo: "", referencia: "", comprobanteUrl: "" });

  const [imagenDraft, setImagenDraft] = useState<{ caption: string }>({ caption: "" });

  const [materialDraft, setMaterialDraft] = useState<{
    descripcion: string;
    cantidad: string;
    unidad: string;
    estado: QuoteMaterialPedido["estado"];
  }>({ descripcion: "", cantidad: "", unidad: "", estado: "pendiente" });

  const [ticketDraft, setTicketDraft] = useState<{
    titulo: string;
    estado: QuoteTicket["estado"];
    url: string;
    descripcion: string;
  }>({ titulo: "", estado: "abierto", url: "", descripcion: "" });

  const { data, isLoading } = useQuery<QuoteDetails | null>({
    queryKey: ["cotizacionDetalle", quoteId],
    enabled: open && !!quoteId,
    queryFn: async () => {
      const res = await axios.get(`/api/cotizaciones/${quoteId}`);
      return (res.data.data ?? null) as QuoteDetails | null;
    },
  });

  const quote = data ?? null;

  const clienteNombre = quote?.cliente?.nombreCompleto || "—";
  const clienteEmail = (quote?.cliente as unknown as { email?: string } | undefined)?.email || "";
  const clienteTelefono = quote?.cliente?.telefono || "";

  const waPhone = useMemo(
    () => normalizePhoneForWA(clienteTelefono) || "5491111111111",
    [clienteTelefono]
  );

  const waMessage = useMemo(() => {
    const msg = `Hola ${clienteNombre}, te escribo por la cotización ${quote?.codigo || ""}.`;
    return encodeURIComponent(msg);
  }, [clienteNombre, quote?.codigo]);

  const handleEmail = () => {
    const to = clienteEmail ? `${encodeURIComponent(clienteEmail)}` : "";
    const subject = encodeURIComponent(`Cotización ${quote?.codigo || ""}`);
    const body = encodeURIComponent(
      `Hola ${clienteNombre},\n\nTe escribo por la cotización ${quote?.codigo || ""}.\n\nSaludos.`
    );
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
      // no-op
    }
  };

  const putMutation = useMutation({
    mutationFn: async (payload: PutOps) => {
      if (!quoteId) throw new Error("quoteId requerido");
      const res = await axios.put(`/api/cotizaciones/${quoteId}`, payload);
      return res.data.data as QuoteDetails;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["cotizacionDetalle", quoteId], updated);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (args: { files: File[]; folder: string }) => {
      const { files, folder } = args;
      const uploads: QuoteArchivo[] = [];

      for (const f of files) {
        const form = new FormData();
        form.append("file", f);

        const res = await axios.post(
          `/api/uploads/cloudinary?folder=${encodeURIComponent(folder)}`,
          form,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const url = res.data.url as string;
        const publicId = res.data.public_id as string | undefined;

        uploads.push({
          uid: uid(),
          url,
          publicId,
          name: f.name,
          createdAt: new Date().toISOString(),
        });
      }

      return uploads;
    },
  });

  const busy = isLoading || putMutation.isPending || uploadMutation.isPending;

  const history = Array.isArray(quote?.historialEtapas) ? quote!.historialEtapas! : [];
  const lastMove = history.length ? history[history.length - 1] : undefined;

  const attachments = normalizeArchivos(quote?.archivos);
  const facturas = quote?.facturas ?? [];
  const pagos = quote?.pagos ?? [];
  const imagenes = quote?.imagenes ?? [];
  const materialPedido = quote?.materialPedido ?? [];
  const tickets = quote?.tickets ?? [];

  // -------------------- Header edit handlers --------------------
  const startEditName = () => {
    setNameDraft(quote?.nombre?.trim() || "");
    setIsEditingName(true);
  };
  const cancelEditName = () => {
    setIsEditingName(false);
    setNameDraft("");
  };
  const saveName = async () => {
    await putMutation.mutateAsync({ op: "setNombre", nombre: nameDraft.trim() });
    setIsEditingName(false);
  };

  const startEditCode = () => {
    setCodeDraft(quote?.codigo?.trim() || "");
    setIsEditingCode(true);
  };
  const cancelEditCode = () => {
    setIsEditingCode(false);
    setCodeDraft("");
  };
  const saveCode = async () => {
    // formato sugerido: COT-001, pero no lo fuerzo (solo trim y mayúsculas)
    const next = codeDraft.trim().toUpperCase();
    await putMutation.mutateAsync({ op: "setCodigo", codigo: next });
    setIsEditingCode(false);
  };

  // -------------------- Upload helpers (restricciones por sección) --------------------
  const folderBase = `cotizaciones/${quoteId ?? "general"}`;

  const pickAttachments = () => attachmentsInputRef.current?.click();
  const pickFacturaFile = () => facturaInputRef.current?.click();
  const pickPagoImage = () => pagoInputRef.current?.click();
  const pickImagenes = () => imagenesInputRef.current?.click();

  const onAttachmentsSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;

    const files = Array.from(list);
    e.target.value = "";

    const uploaded = await uploadMutation.mutateAsync({ files, folder: `${folderBase}/adjuntos` });
    await putMutation.mutateAsync({ op: "appendArchivos", archivos: uploaded }); // cantidad ilimitada
  };

  const onFacturaSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";

    // pdf + imágenes (por accept)
    const uploaded = await uploadMutation.mutateAsync({ files, folder: `${folderBase}/facturas` });

    // si subieron varios, dejamos el primero en el draft (el resto podrías guardarlo como adjuntos si querés)
    const first = uploaded[0];
    if (first?.url) setFacturaDraft((s) => ({ ...s, url: first.url }));
  };

  const onPagoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";

    // solo imágenes (por accept)
    const uploaded = await uploadMutation.mutateAsync({ files, folder: `${folderBase}/pagos` });
    const first = uploaded[0];
    if (first?.url) setPagoDraft((s) => ({ ...s, comprobanteUrl: first.url }));
  };

  const onImagenesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";

    // subimos imágenes a cloudinary y creamos items en imagenes
    const uploaded = await uploadMutation.mutateAsync({ files, folder: `${folderBase}/imagenes` });

    // agregamos una por una al array "imagenes"
    for (const u of uploaded) {
      await putMutation.mutateAsync({
        op: "addImagen",
        imagen: { uid: uid(), url: u.url, caption: u.name },
      });
    }
  };

  const removeArchivo = async (uidToRemove: string) => {
    await putMutation.mutateAsync({ op: "removeArchivo", uid: uidToRemove });
  };

  // -------------------- Create entities --------------------
  const addFactura = async () => {
    const montoNum = Number(facturaDraft.monto || 0);
    const f: QuoteFactura = {
      uid: uid(),
      numero: facturaDraft.numero.trim() || undefined,
      fecha: facturaDraft.fecha || undefined,
      monto: Number.isFinite(montoNum) ? montoNum : 0,
      estado: facturaDraft.estado,
      url: facturaDraft.url.trim() || undefined,
    };
    await putMutation.mutateAsync({ op: "addFactura", factura: f });
    setFacturaDraft({ numero: "", fecha: "", monto: "", estado: "pendiente", url: "" });
  };

  const addPago = async () => {
    const montoNum = Number(pagoDraft.monto || 0);
    const p: QuotePago = {
      uid: uid(),
      fecha: pagoDraft.fecha || undefined,
      monto: Number.isFinite(montoNum) ? montoNum : 0,
      metodo: pagoDraft.metodo.trim() || undefined,
      referencia: pagoDraft.referencia.trim() || undefined,
      comprobanteUrl: pagoDraft.comprobanteUrl.trim() || undefined,
    };
    await putMutation.mutateAsync({ op: "addPago", pago: p });
    setPagoDraft({ fecha: "", monto: "", metodo: "", referencia: "", comprobanteUrl: "" });
  };

  const addMaterial = async () => {
    const desc = materialDraft.descripcion.trim();
    if (!desc) return;
    const cantNum = materialDraft.cantidad ? Number(materialDraft.cantidad) : undefined;

    const m: QuoteMaterialPedido = {
      uid: uid(),
      descripcion: desc,
      cantidad: cantNum && Number.isFinite(cantNum) ? cantNum : undefined,
      unidad: materialDraft.unidad.trim() || undefined,
      estado: materialDraft.estado,
    };

    await putMutation.mutateAsync({ op: "addMaterial", material: m });
    setMaterialDraft({ descripcion: "", cantidad: "", unidad: "", estado: "pendiente" });
  };

  const addTicket = async () => {
    const t = ticketDraft.titulo.trim();
    if (!t) return;

    const tk: QuoteTicket = {
      uid: uid(),
      titulo: t,
      estado: ticketDraft.estado,
      url: ticketDraft.url.trim() || undefined,
      descripcion: ticketDraft.descripcion.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await putMutation.mutateAsync({ op: "addTicket", ticket: tk });
    setTicketDraft({ titulo: "", estado: "abierto", url: "", descripcion: "" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        {/* hidden inputs (restricciones por sección) */}
        <input ref={attachmentsInputRef} type="file" multiple className="hidden" onChange={onAttachmentsSelected} />
        <input
          ref={facturaInputRef}
          type="file"
          multiple={false}
          className="hidden"
          accept="application/pdf,image/*"
          onChange={onFacturaSelected}
        />
        <input
          ref={pagoInputRef}
          type="file"
          multiple={false}
          className="hidden"
          accept="image/*"
          onChange={onPagoSelected}
        />
        <input
          ref={imagenesInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*"
          onChange={onImagenesSelected}
        />

        {/* Header premium */}
        <div className="sticky top-0 z-10 border-b bg-gradient-to-b from-background/90 to-background/60 backdrop-blur">
          <SheetHeader className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-base sm:text-lg truncate">
                    {isLoading ? "Cargando…" : `Detalle de negocio`}
                  </SheetTitle>
                  <Badge className="rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-sm">
                    {quote?.etapa?.nombre || "Sin etapa"}
                  </Badge>
                </div>

                {/* Código editable (punto 1) */}
                <div className="mt-3 rounded-2xl border bg-background/60 shadow-sm p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">Código</div>
                      {isEditingCode ? (
                        <div className="mt-1 flex items-center gap-2">
                          <Input
                            value={codeDraft}
                            onChange={(e) => setCodeDraft(e.target.value)}
                            className="h-9"
                            placeholder="Ej: COT-001"
                          />
                          <IconCta label="Guardar código" onClick={saveCode} disabled={busy}>
                            <Check className="h-4 w-4" />
                          </IconCta>
                          <IconCta label="Cancelar" onClick={cancelEditCode} disabled={busy}>
                            <X className="h-4 w-4" />
                          </IconCta>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="text-sm font-semibold tracking-tight">{quote?.codigo || "—"}</div>
                          <IconCta label="Editar código" onClick={startEditCode} disabled={!quote || busy}>
                            <Hash className="h-4 w-4" />
                          </IconCta>
                          <IconCta label="Copiar código" onClick={() => copy(String(quote?.codigo || ""))} disabled={!quote}>
                            <Copy className="h-4 w-4" />
                          </IconCta>
                        </div>
                      )}
                    </div>

                    {/* Nombre editable */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] text-muted-foreground">Nombre</div>
                      {isEditingName ? (
                        <div className="mt-1 flex items-center gap-2">
                          <Input
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            className="h-9"
                            placeholder="Ej: Aberturas premium - Casa Pérez"
                          />
                          <IconCta label="Guardar nombre" onClick={saveName} disabled={busy}>
                            <Check className="h-4 w-4" />
                          </IconCta>
                          <IconCta label="Cancelar" onClick={cancelEditName} disabled={busy}>
                            <X className="h-4 w-4" />
                          </IconCta>
                        </div>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="text-sm font-semibold truncate">
                            {quote?.nombre?.trim() ? quote.nombre : "—"}
                          </div>
                          <IconCta label="Editar nombre" onClick={startEditName} disabled={!quote || busy}>
                            <Pencil className="h-4 w-4" />
                          </IconCta>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground truncate">
                    {clienteNombre}
                  </div>
                </div>
              </div>

              {/* ✅ Todos los botones juntos (punto 9) */}
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <IconCta label="Email" onClick={handleEmail} disabled={!quote}>
                    <Mail className="h-4 w-4" />
                  </IconCta>
                  <IconCta label="WhatsApp" onClick={handleWhatsApp} disabled={!quote}>
                    <FaWhatsapp className="h-4 w-4" />
                  </IconCta>
                  <IconCta label="Subir adjuntos" onClick={pickAttachments} disabled={!quote || busy}>
                    <Upload className="h-4 w-4" />
                  </IconCta>

                  {/* Notas / Interacciones en el mismo bloque */}
                  {quote?.cliente ? (
                    <>
                      <TableCellActions client={quote.cliente as Client} actionType="notas" />
                      <TableCellActions client={quote.cliente as Client} actionType="interacciones" />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        {/* Body */}
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="px-5 py-5 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-56 w-full" />
              </div>
            ) : !quote ? (
              <div className="text-sm text-muted-foreground">No se encontró la cotización.</div>
            ) : (
              <>
                {/* Resumen premium */}
                <Card className="relative overflow-hidden rounded-3xl border shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/10 to-primary/5" />
                  <div className="relative p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs text-muted-foreground">Monto total</div>
                        <div className="text-3xl font-semibold tracking-tight">{money(quote.montoTotal)}</div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Vendedor:{" "}
                          <span className="font-medium text-foreground">{quote.vendedor?.name || "—"}</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Actualizada:{" "}
                          <span className="font-medium text-foreground">{fmtDate(quote.updatedAt)}</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copy(String(quote.codigo || ""))}
                        className="rounded-xl gap-2 bg-background/70"
                      >
                        <Copy className="h-4 w-4" /> Copiar código
                      </Button>
                    </div>

                    {quote.detalle ? (
                      <>
                        <Separator className="my-4" />
                        <div className="text-xs text-muted-foreground mb-1">Detalle</div>
                        <div className="rounded-2xl border bg-background/60 p-4 text-sm whitespace-pre-wrap leading-relaxed">
                          {quote.detalle}
                        </div>
                      </>
                    ) : null}
                  </div>
                </Card>

                {/* (7) Card destacada "Resumen IA" NO utilizable */}
                <Card className="rounded-3xl border shadow-sm overflow-hidden p-0">
                  <div className="p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5" />
                          <div className="text-base font-semibold">Servicio Premium: Resumen IA del lead</div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Un asistente IA que resume todo el negocio y responde preguntas como:
                          <span className="font-medium text-foreground"> “¿en qué estado está este negocio?”</span>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          *Requiere contratación. No está habilitado en este plan.
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="rounded-xl gap-2"
                        disabled
                        title="Servicio premium - requiere contratación"
                      >
                        <Lock className="h-4 w-4" />
                        Contratar
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Secciones (acordeones) */}
                <Card className="rounded-3xl border shadow-sm p-2">
                  <Accordion type="multiple" className="w-full">
                    {/* (2) Última actividad mejorada */}
                    <AccordionItem value="last-activity">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Última actividad o movimiento</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        {!lastMove ? (
                          <div className="text-sm text-muted-foreground">Sin movimientos registrados.</div>
                        ) : (
                          <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">
                                  {lastMove.etapa?.nombre || "Movimiento"}
                                </div>
                                <div className="text-xs text-muted-foreground">{fmtDate(lastMove.fecha)}</div>
                              </div>
                              <Badge variant="outline" className="rounded-full">
                                {Object.keys(lastMove.datosFormulario ?? {}).length ? "Con datos" : "Sin datos"}
                              </Badge>
                            </div>

                            {Object.keys(lastMove.datosFormulario ?? {}).length ? (
                              <>
                                <Separator className="my-3" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {Object.entries(lastMove.datosFormulario ?? {}).map(([k, v]) => (
                                    <div
                                      key={k}
                                      className="rounded-2xl border bg-background/60 p-3"
                                    >
                                      <div className="text-[11px] text-muted-foreground">
                                        {prettifyKey(k)}
                                      </div>
                                      <div className="mt-1 text-sm font-semibold">
                                        {renderValueWithKey(k, v)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : null}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* (3) Archivos adjuntos: ilimitado */}
                    <AccordionItem value="attachments">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Archivos adjuntos</span>
                          <Badge className="ml-2 rounded-full bg-primary/15 text-primary">
                            {attachments.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground">
                            Subís la cantidad que necesites (Cloudinary).
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2"
                            onClick={pickAttachments}
                            disabled={busy}
                          >
                            <Upload className="h-4 w-4" />
                            Subir
                          </Button>
                        </div>

                        <Separator className="my-3" />

                        {attachments.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No hay archivos adjuntos.</div>
                        ) : (
                          <div className="space-y-2">
                            {attachments.map((a) => (
                              <div
                                key={a.uid}
                                className="flex items-center justify-between gap-3 rounded-2xl border bg-background/60 px-3 py-2 shadow-sm"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold truncate">
                                    {a.name || fileNameFromUrl(a.url)}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">{a.url}</div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl"
                                    onClick={() => copy(a.url)}
                                    title="Copiar link"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl"
                                    onClick={() => window.open(a.url, "_blank", "noopener,noreferrer")}
                                    title="Abrir"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl"
                                    onClick={() => window.open(a.url, "_blank", "noopener,noreferrer")}
                                    title="Descargar"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl"
                                    onClick={() => removeArchivo(a.uid)}
                                    disabled={busy}
                                    title="Eliminar de la cotización"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* (4) Facturas: subir pdf o imágenes */}
                    <AccordionItem value="invoices">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Facturas</span>
                          <Badge className="ml-2 rounded-full bg-primary/15 text-primary">
                            {facturas.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        <div className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Nueva factura</div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl gap-2"
                              onClick={pickFacturaFile}
                              disabled={busy}
                              title="Subir PDF o imagen a Cloudinary"
                            >
                              <Upload className="h-4 w-4" />
                              Adjuntar
                            </Button>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={facturaDraft.numero}
                                onChange={(e) => setFacturaDraft((s) => ({ ...s, numero: e.target.value }))}
                                placeholder="Número"
                                className="h-9 rounded-xl"
                              />
                              <Input
                                value={facturaDraft.fecha}
                                onChange={(e) => setFacturaDraft((s) => ({ ...s, fecha: e.target.value }))}
                                placeholder="Fecha (YYYY-MM-DD)"
                                className="h-9 rounded-xl"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={facturaDraft.monto}
                                onChange={(e) => setFacturaDraft((s) => ({ ...s, monto: e.target.value }))}
                                placeholder="Monto"
                                className="h-9 rounded-xl"
                              />
                              <Input
                                value={facturaDraft.estado}
                                onChange={(e) =>
                                  setFacturaDraft((s) => ({
                                    ...s,
                                    estado: e.target.value as QuoteFactura["estado"],
                                  }))
                                }
                                placeholder="Estado: pendiente|pagada|vencida|anulada"
                                className="h-9 rounded-xl"
                              />
                            </div>

                            <Input
                              value={facturaDraft.url}
                              onChange={(e) => setFacturaDraft((s) => ({ ...s, url: e.target.value }))}
                              placeholder="URL (se completa al adjuntar)"
                              className="h-9 rounded-xl"
                            />

                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={addFactura}
                                disabled={busy}
                              >
                                <Plus className="h-4 w-4" />
                                Agregar factura
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {facturas.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No hay facturas registradas.</div>
                        ) : (
                          <div className="space-y-2">
                            {facturas.map((f) => (
                              <div key={f.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate">{f.numero || "Factura"}</div>
                                    <div className="text-xs text-muted-foreground">{fmtDate(f.fecha)}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="rounded-full">
                                      {f.estado || "pendiente"}
                                    </Badge>
                                    <div className="text-sm font-semibold">{money(f.monto)}</div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl"
                                      onClick={() => putMutation.mutate({ op: "removeFactura", uid: f.uid })}
                                      disabled={busy}
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                {f.url ? (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl gap-2"
                                      onClick={() => window.open(f.url!, "_blank", "noopener,noreferrer")}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Ver adjunto
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl gap-2"
                                      onClick={() => copy(f.url!)}
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copiar link
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* (5) Pagos: solo imágenes */}
                    <AccordionItem value="payments">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Pagos</span>
                          <Badge className="ml-2 rounded-full bg-primary/15 text-primary">
                            {pagos.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        <div className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold">Nuevo pago</div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl gap-2"
                              onClick={pickPagoImage}
                              disabled={busy}
                              title="Subir comprobante (solo imagen)"
                            >
                              <Upload className="h-4 w-4" />
                              Subir comprobante
                            </Button>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={pagoDraft.fecha}
                                onChange={(e) => setPagoDraft((s) => ({ ...s, fecha: e.target.value }))}
                                placeholder="Fecha (YYYY-MM-DD)"
                                className="h-9 rounded-xl"
                              />
                              <Input
                                value={pagoDraft.monto}
                                onChange={(e) => setPagoDraft((s) => ({ ...s, monto: e.target.value }))}
                                placeholder="Monto"
                                className="h-9 rounded-xl"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={pagoDraft.metodo}
                                onChange={(e) => setPagoDraft((s) => ({ ...s, metodo: e.target.value }))}
                                placeholder="Método"
                                className="h-9 rounded-xl"
                              />
                              <Input
                                value={pagoDraft.referencia}
                                onChange={(e) => setPagoDraft((s) => ({ ...s, referencia: e.target.value }))}
                                placeholder="Referencia"
                                className="h-9 rounded-xl"
                              />
                            </div>

                            <Input
                              value={pagoDraft.comprobanteUrl}
                              onChange={(e) => setPagoDraft((s) => ({ ...s, comprobanteUrl: e.target.value }))}
                              placeholder="URL comprobante (se completa al subir)"
                              className="h-9 rounded-xl"
                            />

                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={addPago}
                                disabled={busy}
                              >
                                <Plus className="h-4 w-4" />
                                Agregar pago
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {pagos.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No hay pagos registrados.</div>
                        ) : (
                          <div className="space-y-2">
                            {pagos.map((p) => (
                              <div key={p.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold">{p.metodo || "Pago"}</div>
                                    <div className="text-xs text-muted-foreground">{fmtDate(p.fecha)}</div>
                                    {p.referencia ? (
                                      <div className="text-xs text-muted-foreground truncate">Ref: {p.referencia}</div>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold">{money(p.monto)}</div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl"
                                      onClick={() => putMutation.mutate({ op: "removePago", uid: p.uid })}
                                      disabled={busy}
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {p.comprobanteUrl ? (
                                  <div className="mt-3 flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl gap-2"
                                      onClick={() => window.open(p.comprobanteUrl!, "_blank", "noopener,noreferrer")}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                      Ver comprobante
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-xl gap-2"
                                      onClick={() => copy(p.comprobanteUrl!)}
                                    >
                                      <Copy className="h-4 w-4" />
                                      Copiar link
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* (6) Imágenes subidas a Cloudinary */}
                    <AccordionItem value="images">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Imágenes</span>
                          <Badge className="ml-2 rounded-full bg-primary/15 text-primary">
                            {imagenes.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground">
                            Subí imágenes (Cloudinary). Se agregan automáticamente a la sección.
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl gap-2"
                            onClick={pickImagenes}
                            disabled={busy}
                          >
                            <Upload className="h-4 w-4" />
                            Subir imágenes
                          </Button>
                        </div>

                        <Separator className="my-3" />

                        {imagenes.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No hay imágenes.</div>
                        ) : (
                          <div className="space-y-2">
                            {imagenes.map((img) => (
                              <div key={img.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate">
                                      {img.caption || fileNameFromUrl(img.url)}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">{img.url}</div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl"
                                      onClick={() => window.open(img.url, "_blank", "noopener,noreferrer")}
                                      title="Abrir"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl"
                                      onClick={() => putMutation.mutate({ op: "removeImagen", uid: img.uid })}
                                      disabled={busy}
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Material pedido */}
                    <AccordionItem value="materials">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Boxes className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Material pedido</span>
                          <Badge className="ml-2 rounded-full bg-primary/15 text-primary">
                            {materialPedido.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        <div className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                          <div className="text-sm font-semibold">Nuevo item</div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <Input
                              value={materialDraft.descripcion}
                              onChange={(e) => setMaterialDraft((s) => ({ ...s, descripcion: e.target.value }))}
                              placeholder="Descripción"
                              className="h-9 rounded-xl"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={materialDraft.cantidad}
                                onChange={(e) => setMaterialDraft((s) => ({ ...s, cantidad: e.target.value }))}
                                placeholder="Cantidad"
                                className="h-9 rounded-xl"
                              />
                              <Input
                                value={materialDraft.unidad}
                                onChange={(e) => setMaterialDraft((s) => ({ ...s, unidad: e.target.value }))}
                                placeholder="Unidad (ej: u, m2)"
                                className="h-9 rounded-xl"
                              />
                            </div>
                            <Input
                              value={materialDraft.estado}
                              onChange={(e) =>
                                setMaterialDraft((s) => ({
                                  ...s,
                                  estado: e.target.value as QuoteMaterialPedido["estado"],
                                }))
                              }
                              placeholder="Estado: pendiente|pedido|recibido|cancelado"
                              className="h-9 rounded-xl"
                            />

                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={addMaterial}
                                disabled={busy}
                              >
                                <Plus className="h-4 w-4" />
                                Agregar
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {materialPedido.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No hay material pedido.</div>
                        ) : (
                          <div className="space-y-2">
                            {materialPedido.map((m) => (
                              <div key={m.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold">{m.descripcion}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {m.cantidad ?? "—"} {m.unidad ?? ""}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="rounded-full">
                                      {m.estado || "pendiente"}
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl"
                                      onClick={() => putMutation.mutate({ op: "removeMaterial", uid: m.uid })}
                                      disabled={busy}
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Tickets */}
                    <AccordionItem value="tickets">
                      <AccordionTrigger className="px-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold">Tickets (soporte)</span>
                          <Badge className="ml-2 rounded-full bg-primary/15 text-primary">
                            {tickets.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-4">
                        <div className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                          <div className="text-sm font-semibold">Nuevo ticket</div>

                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <Input
                              value={ticketDraft.titulo}
                              onChange={(e) => setTicketDraft((s) => ({ ...s, titulo: e.target.value }))}
                              placeholder="Título"
                              className="h-9 rounded-xl"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={ticketDraft.estado}
                                onChange={(e) =>
                                  setTicketDraft((s) => ({
                                    ...s,
                                    estado: e.target.value as QuoteTicket["estado"],
                                  }))
                                }
                                placeholder="Estado: abierto|en_progreso|cerrado"
                                className="h-9 rounded-xl"
                              />
                              <Input
                                value={ticketDraft.url}
                                onChange={(e) => setTicketDraft((s) => ({ ...s, url: e.target.value }))}
                                placeholder="URL (opcional)"
                                className="h-9 rounded-xl"
                              />
                            </div>
                            <Textarea
                              value={ticketDraft.descripcion}
                              onChange={(e) => setTicketDraft((s) => ({ ...s, descripcion: e.target.value }))}
                              placeholder="Descripción (opcional)"
                            />
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={addTicket}
                                disabled={busy}
                              >
                                <Plus className="h-4 w-4" />
                                Agregar ticket
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {tickets.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No hay tickets.</div>
                        ) : (
                          <div className="space-y-2">
                            {tickets.map((t) => (
                              <div key={t.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold">{t.titulo}</div>
                                    <div className="text-xs text-muted-foreground">{t.createdAt ? fmtDate(t.createdAt) : "—"}</div>
                                    {t.descripcion ? (
                                      <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                                        {t.descripcion}
                                      </div>
                                    ) : null}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="rounded-full">
                                      {t.estado || "abierto"}
                                    </Badge>
                                    {t.url ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl gap-2"
                                        onClick={() => window.open(t.url!, "_blank", "noopener,noreferrer")}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Ver
                                      </Button>
                                    ) : null}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-xl"
                                      onClick={() => putMutation.mutate({ op: "removeTicket", uid: t.uid })}
                                      disabled={busy}
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </Card>

                {/* Cliente (quick) */}
                <Card className="rounded-3xl border shadow-sm p-5">
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">Nombre</div>
                      <div className="text-sm font-semibold">{clienteNombre}</div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">Teléfono</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{clienteTelefono || "—"}</div>
                        {clienteTelefono ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => copy(clienteTelefono)} title="Copiar">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => window.open(`tel:${clienteTelefono}`, "_self")} title="Llamar">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">Email</div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold break-all">{clienteEmail || "—"}</div>
                        {clienteEmail ? (
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => copy(clienteEmail)} title="Copiar">
                            <Copy className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
