"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import {
  Mail,
  Paperclip,
  Copy,
  ExternalLink,
  Phone,
  User2,
  Check,
  X,
  Receipt,
  CreditCard,
  Image as ImageIcon,
  Boxes,
  LifeBuoy,
  Activity,
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

function cleanUrl(u: string) {
  return u.split("?")[0] || u;
}

function extFromUrl(u: string) {
  const base = cleanUrl(u);
  const last = base.split("/").pop() || "";
  const parts = last.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

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

type PipelineQuoteLite = {
  _id: string;
  codigo?: string;
  nombre?: string;
  updatedAt?: string;
} & Record<string, unknown>;

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isPdfAttachment(a: QuoteArchivo) {
  const name = (a.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return true;
  const ext = extFromUrl(a.url);
  return ext === "pdf";
}

function isImageAttachment(a: QuoteArchivo) {
  const name = (a.name || "").toLowerCase();
  if (/\.(png|jpe?g|webp|gif|bmp|svg)$/.test(name)) return true;
  const ext = extFromUrl(a.url);
  return ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"].includes(ext);
}

function prettifyKey(key: string) {
  return key
    .replace(/^__/, "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isMoneyKey(k: string) {
  const t = k.toLowerCase();
  return t.includes("precio") || t.includes("monto") || t.includes("total") || t.includes("importe");
}

function money(n: unknown) {
  const val = typeof n === "number" ? n : Number(n || 0);
  return `$${(Number.isFinite(val) ? val : 0).toLocaleString("es-AR")}`;
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
  return d ? new Date(d).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" }) : "—";
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

function truncate(s: string, max = 20) {
  const t = (s ?? "").trim();
  if (!t) return "archivo";
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
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

function Dropzone({
  title,
  subtitle,
  acceptHint,
  disabled,
  onPick,
  onFiles,
}: {
  title: string;
  subtitle?: string;
  acceptHint?: string;
  disabled?: boolean;
  onPick: () => void;
  onFiles: (files: File[]) => void;
}) {
  const [isOver, setIsOver] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    if (disabled) return;
    const list = e.dataTransfer.files;
    if (!list?.length) return;
    onFiles(Array.from(list));
  };

  return (
    <div
      className={[
        "rounded-2xl border bg-background/60 p-4 shadow-sm",
        isOver ? "ring-2 ring-primary/30 border-primary/40" : "",
        disabled ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
          {acceptHint ? <div className="mt-1 text-[11px] text-muted-foreground">{acceptHint}</div> : null}
        </div>
        <Button variant="outline" size="sm" className="rounded-xl gap-2 shrink-0" onClick={onPick} disabled={disabled}>
          <Upload className="h-4 w-4" />
          Subir
        </Button>
      </div>
    </div>
  );
}

function applyOptimistic(old: QuoteDetails | null, payload: PutOps): QuoteDetails | null {
  if (!old) return old;

  switch (payload.op) {
    case "setCodigo":
      return { ...old, codigo: payload.codigo };
    case "setNombre":
      return { ...old, nombre: payload.nombre };

    case "appendArchivos":
      return { ...old, archivos: [...normalizeArchivos(old.archivos), ...payload.archivos] };

    case "removeArchivo":
      return { ...old, archivos: normalizeArchivos(old.archivos).filter((a) => a.uid !== payload.uid) };

    case "addFactura":
      return { ...old, facturas: [...(old.facturas ?? []), payload.factura] };

    case "removeFactura":
      return { ...old, facturas: (old.facturas ?? []).filter((f) => f.uid !== payload.uid) };

    case "addPago":
      return { ...old, pagos: [...(old.pagos ?? []), payload.pago] };

    case "removePago":
      return { ...old, pagos: (old.pagos ?? []).filter((p) => p.uid !== payload.uid) };

    case "addImagen":
      return { ...old, imagenes: [...(old.imagenes ?? []), payload.imagen] };

    case "removeImagen":
      return { ...old, imagenes: (old.imagenes ?? []).filter((i) => i.uid !== payload.uid) };

    case "addMaterial":
      return { ...old, materialPedido: [...(old.materialPedido ?? []), payload.material] };

    case "removeMaterial":
      return { ...old, materialPedido: (old.materialPedido ?? []).filter((m) => m.uid !== payload.uid) };

    case "addTicket":
      return { ...old, tickets: [...(old.tickets ?? []), payload.ticket] };

    case "removeTicket":
      return { ...old, tickets: (old.tickets ?? []).filter((t) => t.uid !== payload.uid) };

    default:
      return old;
  }
}

export function QuoteDetailsDialog({
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

  // ❌ eliminado: isEditingName/nameDraft/startEditName/cancelEditName/saveName (no se usaban)

  const [isEditingCode, setIsEditingCode] = useState(false);
  const [codeDraft, setCodeDraft] = useState("");

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

  // ✅ mismo queryKey que el Sheet para compartir cache/updates
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

  const waPhone = useMemo(() => normalizePhoneForWA(clienteTelefono) || "5491111111111", [clienteTelefono]);

  const waMessage = useMemo(() => {
    const msg = `Hola ${clienteNombre}, te escribo por la cotización ${quote?.codigo || ""}.`;
    return encodeURIComponent(msg);
  }, [clienteNombre, quote?.codigo]);

  const handleEmail = () => {
    const to = clienteEmail ? `${encodeURIComponent(clienteEmail)}` : "";
    const subject = encodeURIComponent(`Cotización ${quote?.codigo || ""}`);
    const body = encodeURIComponent(`Hola ${clienteNombre},\n\nTe escribo por la cotización ${quote?.codigo || ""}.\n\nSaludos.`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/${waPhone}?text=${waMessage}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado", { description: "Se copió al portapapeles." });
    } catch {
      toast.error("No se pudo copiar", { description: "Tu navegador bloqueó el portapapeles." });
    }
  };

  const putMutation = useMutation({
    mutationFn: async (payload: PutOps) => {
      if (!quoteId) throw new Error("quoteId requerido");
      const res = await axios.put(`/api/cotizaciones/${quoteId}`, payload);
      return res.data.data as QuoteDetails;
    },

    onMutate: async (payload: PutOps) => {
      if (!quoteId) return;

      await queryClient.cancelQueries({ queryKey: ["cotizacionDetalle", quoteId] });
      await queryClient.cancelQueries({ queryKey: ["cotizacionesPipeline"] });

      const prevDetail = queryClient.getQueryData<QuoteDetails | null>(["cotizacionDetalle", quoteId]);
      const prevLists = queryClient.getQueriesData<unknown>({ queryKey: ["cotizacionesPipeline"], exact: false });

      queryClient.setQueryData(["cotizacionDetalle", quoteId], (old: QuoteDetails | null) => applyOptimistic(old, payload));

      // pipeline/tabla: solo nombre/codigo
      if (payload.op === "setCodigo" || payload.op === "setNombre") {
        queryClient.setQueriesData({ queryKey: ["cotizacionesPipeline"], exact: false }, (old: unknown) => {
          if (!Array.isArray(old)) return old;

          const arr = old as PipelineQuoteLite[];
          return arr.map((q) => {
            if (q?._id !== quoteId) return q;
            return {
              ...q,
              ...(payload.op === "setCodigo" ? { codigo: payload.codigo } : {}),
              ...(payload.op === "setNombre" ? { nombre: payload.nombre } : {}),
            } satisfies PipelineQuoteLite;
          });
        });
      }

      return { prevDetail, prevLists };
    },

    onError: (_err, _payload, ctx) => {
      if (quoteId && ctx?.prevDetail !== undefined) {
        queryClient.setQueryData(["cotizacionDetalle", quoteId], ctx.prevDetail);
      }

      if (ctx?.prevLists?.length) {
        ctx.prevLists.forEach(([key, data]) => {
          queryClient.setQueryData(key as QueryKey, data);
        });
      }

      toast.error("Error", { description: "No se pudo guardar el cambio." });
    },

    onSuccess: (updated, payload) => {
      queryClient.setQueryData(["cotizacionDetalle", quoteId], updated);

      if (payload.op === "setCodigo" || payload.op === "setNombre") {
        queryClient.setQueriesData({ queryKey: ["cotizacionesPipeline"], exact: false }, (old: unknown) => {
          if (!Array.isArray(old)) return old;

          const arr = old as PipelineQuoteLite[];
          return arr.map((q) => {
            if (q?._id !== updated._id) return q;
            return {
              ...q,
              codigo: updated.codigo ?? q.codigo,
              nombre: updated.nombre ?? q.nombre,
              updatedAt: updated.updatedAt ?? q.updatedAt,
            } satisfies PipelineQuoteLite;
          });
        });
      }

      const msgByOp: Record<PutOps["op"], string> = {
        setCodigo: "Código actualizado.",
        setNombre: "Nombre actualizado.",
        appendArchivos: "Adjunto(s) agregados.",
        removeArchivo: "Adjunto eliminado.",
        addFactura: "Factura agregada.",
        removeFactura: "Factura eliminada.",
        addPago: "Pago agregado.",
        removePago: "Pago eliminado.",
        addImagen: "Imagen agregada.",
        removeImagen: "Imagen eliminada.",
        addMaterial: "Material agregado.",
        removeMaterial: "Material eliminado.",
        addTicket: "Ticket agregado.",
        removeTicket: "Ticket eliminado.",
      };

      toast.success("Listo", { description: msgByOp[payload.op] ?? "Cambio guardado." });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (args: { files: File[]; folder: string }) => {
      const { files, folder } = args;
      const uploads: QuoteArchivo[] = [];

      for (const f of files) {
        const form = new FormData();
        form.append("file", f);

        const res = await axios.post(`/api/uploads/cloudinary?folder=${encodeURIComponent(folder)}`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

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
    onError: () => toast.error("Error", { description: "No se pudieron subir los archivos." }),
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

  // -------------------- Edit handlers (solo código) --------------------
  const startEditCode = () => {
    setCodeDraft(quote?.codigo?.trim() || "");
    setIsEditingCode(true);
  };
  const cancelEditCode = () => {
    setIsEditingCode(false);
    setCodeDraft("");
  };
  const saveCode = async () => {
    const next = codeDraft.trim().toUpperCase();
    await putMutation.mutateAsync({ op: "setCodigo", codigo: next });
    setIsEditingCode(false);
  };

  // -------------------- Upload helpers --------------------
  const folderBase = `cotizaciones/${quoteId ?? "general"}`;

  const pickAttachments = () => attachmentsInputRef.current?.click();
  const pickFacturaFile = () => facturaInputRef.current?.click();
  const pickPagoImage = () => pagoInputRef.current?.click();
  const pickImagenes = () => imagenesInputRef.current?.click();

  const handleAttachmentsFiles = async (files: File[]) => {
    if (!files.length) return;
    const uploaded = await uploadMutation.mutateAsync({ files, folder: `${folderBase}/adjuntos` });
    await putMutation.mutateAsync({ op: "appendArchivos", archivos: uploaded });
  };

  const onAttachmentsSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";
    await handleAttachmentsFiles(files);
  };

  const handleFacturaFiles = async (files: File[]) => {
    if (!files.length) return;
    const uploaded = await uploadMutation.mutateAsync({ files, folder: `${folderBase}/facturas` });

    for (const u of uploaded) {
      const f: QuoteFactura = {
        uid: uid(),
        numero: "-",
        fecha: undefined,
        monto: 0,
        estado: "pendiente",
        url: u.url,
      };
      await putMutation.mutateAsync({ op: "addFactura", factura: f });
    }
  };

  const onFacturaSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";
    await handleFacturaFiles(files);
  };

  const handlePagoFiles = async (files: File[]) => {
    if (!files.length) return;

    const onlyImages = files.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== files.length) {
      toast.warning("Solo imágenes", { description: "Los pagos aceptan únicamente imágenes." });
    }
    if (!onlyImages.length) return;

    const uploaded = await uploadMutation.mutateAsync({ files: onlyImages, folder: `${folderBase}/pagos` });

    for (const u of uploaded) {
      const p: QuotePago = {
        uid: uid(),
        fecha: undefined,
        monto: 0,
        metodo: "-",
        referencia: "-",
        comprobanteUrl: u.url,
      };
      await putMutation.mutateAsync({ op: "addPago", pago: p });
    }
  };

  const onPagoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";
    await handlePagoFiles(files);
  };

  const handleImagenesFiles = async (files: File[]) => {
    if (!files.length) return;

    const onlyImages = files.filter((f) => f.type.startsWith("image/"));
    if (onlyImages.length !== files.length) {
      toast.warning("Solo imágenes", { description: "Esta sección acepta únicamente imágenes." });
    }
    if (!onlyImages.length) return;

    const uploaded = await uploadMutation.mutateAsync({ files: onlyImages, folder: `${folderBase}/imagenes` });

    for (const u of uploaded) {
      await putMutation.mutateAsync({
        op: "addImagen",
        imagen: { uid: uid(), url: u.url, caption: u.name },
      });
    }
  };

  const onImagenesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const files = Array.from(list);
    e.target.value = "";
    await handleImagenesFiles(files);
  };

  const removeArchivo = async (uidToRemove: string) => {
    await putMutation.mutateAsync({ op: "removeArchivo", uid: uidToRemove });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[88vh] p-0 overflow-hidden">
        {/* hidden inputs */}
        <input ref={attachmentsInputRef} type="file" multiple className="hidden" onChange={onAttachmentsSelected} />
        <input
          ref={facturaInputRef}
          type="file"
          multiple
          className="hidden"
          accept="application/pdf,image/*"
          onChange={onFacturaSelected}
        />
        <input ref={pagoInputRef} type="file" multiple className="hidden" accept="image/*" onChange={onPagoSelected} />
        <input ref={imagenesInputRef} type="file" multiple className="hidden" accept="image/*" onChange={onImagenesSelected} />

        {/* Header */}
        <div className="border-b bg-gradient-to-b from-background/95 to-background/70 backdrop-blur px-6 py-4">
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg truncate">{isLoading ? "Cargando…" : "Detalle de negocio"}</DialogTitle>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-sm">
                    {quote?.etapa?.nombre || "Sin etapa"}
                  </Badge>
                  <div className="text-xs text-muted-foreground truncate">{clienteNombre}</div>
                </div>
              </div>

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

                {quote?.cliente ? (
                  <>
                    <TableCellActions client={quote.cliente as Client} actionType="notas" />
                    <TableCellActions client={quote.cliente as Client} actionType="interacciones" />
                  </>
                ) : null}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Body */}
        <ScrollArea className="h-[calc(88vh-72px)]">
          <div className="px-6 py-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : !quote ? (
              <div className="text-sm text-muted-foreground">No se encontró la cotización.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left rail: summary + code */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Código editable */}
                  <Card className="rounded-3xl border shadow-sm p-4">
                    <div className="text-[11px] text-muted-foreground">Código</div>

                    {isEditingCode ? (
                      <div className="mt-2 flex items-center gap-2">
                        <Input value={codeDraft} onChange={(e) => setCodeDraft(e.target.value)} className="h-9" placeholder="Ej: COT-001" />
                        <IconCta label="Guardar código" onClick={saveCode} disabled={busy}>
                          <Check className="h-4 w-4" />
                        </IconCta>
                        <IconCta label="Cancelar" onClick={cancelEditCode} disabled={busy}>
                          <X className="h-4 w-4" />
                        </IconCta>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="text-sm font-semibold tracking-tight">{quote.codigo || "—"}</div>
                        <IconCta label="Editar código" onClick={startEditCode} disabled={busy}>
                          <Hash className="h-4 w-4" />
                        </IconCta>
                        <IconCta label="Copiar código" onClick={() => copyText(String(quote.codigo || ""))}>
                          <Copy className="h-4 w-4" />
                        </IconCta>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div className="text-xs text-muted-foreground">Monto total</div>
                    <div className="mt-1 text-2xl font-semibold tracking-tight">{money(quote.montoTotal)}</div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      Vendedor: <span className="font-medium text-foreground">{quote.vendedor?.name || "—"}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Actualizada: <span className="font-medium text-foreground">{fmtDate(quote.updatedAt)}</span>
                    </div>
                  </Card>

                  {/* Cliente quick */}
                  <Card className="rounded-3xl border shadow-sm p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <User2 className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm font-semibold">Cliente</div>
                      </div>
                      {quote.cliente?._id ? (
                        <Link className="text-xs text-primary hover:underline inline-flex items-center gap-1" href={`/dashboard/listados/${quote.cliente._id}`}>
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
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => copyText(clienteTelefono)} title="Copiar">
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => copyText(clienteEmail)} title="Copiar">
                              <Copy className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Right: sections */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Detalle */}
                  {quote.detalle ? (
                    <Card className="rounded-3xl border shadow-sm p-5">
                      <div className="text-xs text-muted-foreground mb-2">Detalle</div>
                      <div className="rounded-2xl border bg-background/60 p-4 text-sm whitespace-pre-wrap leading-relaxed">{quote.detalle}</div>
                    </Card>
                  ) : null}

                  {/* Premium block */}
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
                          <div className="mt-2 text-xs text-muted-foreground">*Requiere contratación. No está habilitado en este plan.</div>
                        </div>

                        <Button variant="outline" className="rounded-xl gap-2" disabled title="Servicio premium - requiere contratación">
                          <Lock className="h-4 w-4" />
                          Contratar
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Acordeones */}
                  <Card className="rounded-3xl border shadow-sm p-2">
                    <Accordion type="multiple" className="w-full">
                      {/* Última actividad */}
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
                                  <div className="text-sm font-semibold truncate">{lastMove.etapa?.nombre || "Movimiento"}</div>
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
                                      <div key={k} className="rounded-2xl border bg-background/60 p-3">
                                        <div className="text-[11px] text-muted-foreground">{prettifyKey(k)}</div>
                                        <div className="mt-1 text-sm font-semibold">{renderValueWithKey(k, v)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              ) : null}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {/* Adjuntos */}
                      <AccordionItem value="attachments">
                        <AccordionTrigger className="px-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Archivos adjuntos</span>
                            <Badge className="ml-2 rounded-full bg-primary/15 text-primary">{attachments.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4">
                          <Dropzone
                            title="Arrastrá y soltá archivos aquí"
                            subtitle="O subilos desde tu computadora (Cloudinary)."
                            disabled={busy}
                            onPick={pickAttachments}
                            onFiles={handleAttachmentsFiles}
                          />

                          <Separator className="my-3" />

                          {attachments.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No hay archivos adjuntos.</div>
                          ) : (
                            <div className="space-y-2">
                              {attachments.map((a) => {
                                const isPdf = isPdfAttachment(a);
                                const isImg = isImageAttachment(a);
                                const shownName = truncate(a.name || fileNameFromUrl(a.url), 20);

                                return (
                                  <div
                                    key={a.uid}
                                    className="flex items-center justify-between gap-3 rounded-2xl border bg-background/60 px-3 py-2 shadow-sm w-full"
                                  >
                                    <div className="flex-1 min-w-0 flex items-center gap-3 overflow-hidden">
                                      {isImg ? (
                                        <button
                                          type="button"
                                          className="shrink-0 h-12 w-12 rounded-xl overflow-hidden border bg-background"
                                          onClick={() => window.open(a.url, "_blank", "noopener,noreferrer")}
                                          title="Abrir imagen"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={a.url} alt={a.name || "Imagen"} className="h-full w-full object-cover" loading="lazy" />
                                        </button>
                                      ) : null}

                                      <div className="flex-1 min-w-0 overflow-hidden">
                                        <div className="text-sm font-semibold truncate" title={a.name || fileNameFromUrl(a.url)}>
                                          {shownName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{isPdf ? "PDF" : isImg ? "Imagen" : "Archivo"}</div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => copyText(a.url)} title="Copiar link">
                                        <Copy className="h-4 w-4" />
                                      </Button>

                                      <Button
                                        variant={isPdf ? "outline" : "ghost"}
                                        size={isPdf ? "sm" : "icon"}
                                        className={isPdf ? "rounded-xl gap-2" : "h-8 w-8 rounded-xl"}
                                        onClick={() => window.open(a.url, "_blank", "noopener,noreferrer")}
                                        title="Abrir"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        {isPdf ? "Abrir" : null}
                                      </Button>

                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => removeArchivo(a.uid)} disabled={busy} title="Eliminar">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {/* Facturas */}
                      <AccordionItem value="invoices">
                        <AccordionTrigger className="px-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Facturas</span>
                            <Badge className="ml-2 rounded-full bg-primary/15 text-primary">{facturas.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4">
                          <Dropzone
                            title="Arrastrá y soltá facturas aquí"
                            subtitle="Se agrega automáticamente al negocio."
                            acceptHint="Acepta: imágenes y PDF"
                            disabled={busy}
                            onPick={pickFacturaFile}
                            onFiles={handleFacturaFiles}
                          />

                          <Separator className="my-3" />

                          {facturas.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No hay facturas registradas.</div>
                          ) : (
                            <div className="space-y-2">
                              {facturas.map((f) => (
                                <div key={f.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold truncate">Factura</div>
                                      <div className="text-xs text-muted-foreground">{f.url ? truncate(fileNameFromUrl(f.url), 28) : "—"}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="rounded-full">
                                        {f.estado || "pendiente"}
                                      </Badge>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl gap-2"
                                        onClick={() => f.url && window.open(f.url, "_blank", "noopener,noreferrer")}
                                        disabled={!f.url}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Ver
                                      </Button>
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
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {/* Pagos */}
                      <AccordionItem value="payments">
                        <AccordionTrigger className="px-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Pagos</span>
                            <Badge className="ml-2 rounded-full bg-primary/15 text-primary">{pagos.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4">
                          <Dropzone
                            title="Arrastrá y soltá comprobantes aquí"
                            subtitle="Se agrega automáticamente al negocio."
                            acceptHint="Acepta: solo imágenes"
                            disabled={busy}
                            onPick={pickPagoImage}
                            onFiles={handlePagoFiles}
                          />

                          <Separator className="my-3" />

                          {pagos.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No hay pagos registrados.</div>
                          ) : (
                            <div className="space-y-2">
                              {pagos.map((p) => (
                                <div key={p.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold">Pago</div>
                                      <div className="text-xs text-muted-foreground">{p.comprobanteUrl ? truncate(fileNameFromUrl(p.comprobanteUrl), 28) : "—"}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-xl gap-2"
                                        onClick={() => p.comprobanteUrl && window.open(p.comprobanteUrl, "_blank", "noopener,noreferrer")}
                                        disabled={!p.comprobanteUrl}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                        Ver
                                      </Button>
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
                                </div>
                              ))}
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      {/* Imágenes */}
                      <AccordionItem value="images">
                        <AccordionTrigger className="px-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Imágenes</span>
                            <Badge className="ml-2 rounded-full bg-primary/15 text-primary">{imagenes.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4">
                          <Dropzone
                            title="Arrastrá y soltá imágenes aquí"
                            subtitle="Se agregan automáticamente a la sección."
                            acceptHint="Acepta: solo imágenes"
                            disabled={busy}
                            onPick={pickImagenes}
                            onFiles={handleImagenesFiles}
                          />

                          <Separator className="my-3" />

                          {imagenes.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No hay imágenes.</div>
                          ) : (
                            <div className="space-y-2">
                              {imagenes.map((img) => (
                                <div key={img.uid} className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold truncate">{img.caption || truncate(fileNameFromUrl(img.url), 24)}</div>
                                      <div className="text-xs text-muted-foreground">{truncate(fileNameFromUrl(img.url), 28)}</div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => window.open(img.url, "_blank", "noopener,noreferrer")} title="Abrir">
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

                      {/* Material */}
                      <AccordionItem value="materials">
                        <AccordionTrigger className="px-3 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Boxes className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold">Material pedido</span>
                            <Badge className="ml-2 rounded-full bg-primary/15 text-primary">{materialPedido.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4">
                          <div className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                            <div className="text-sm font-semibold">Nuevo item</div>

                            <div className="mt-3 grid grid-cols-1 gap-2">
                              <Input value={materialDraft.descripcion} onChange={(e) => setMaterialDraft((s) => ({ ...s, descripcion: e.target.value }))} placeholder="Descripción" className="h-9 rounded-xl" />
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={materialDraft.cantidad} onChange={(e) => setMaterialDraft((s) => ({ ...s, cantidad: e.target.value }))} placeholder="Cantidad" className="h-9 rounded-xl" />
                                <Input value={materialDraft.unidad} onChange={(e) => setMaterialDraft((s) => ({ ...s, unidad: e.target.value }))} placeholder="Unidad (ej: u, m2)" className="h-9 rounded-xl" />
                              </div>
                              <Input
                                value={materialDraft.estado}
                                onChange={(e) => setMaterialDraft((s) => ({ ...s, estado: e.target.value as QuoteMaterialPedido["estado"] }))}
                                placeholder="Estado: pendiente|pedido|recibido|cancelado"
                                className="h-9 rounded-xl"
                              />

                              <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={addMaterial} disabled={busy}>
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
                                      <Badge variant="outline" className="rounded-full">{m.estado || "pendiente"}</Badge>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => putMutation.mutate({ op: "removeMaterial", uid: m.uid })} disabled={busy} title="Eliminar">
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
                            <Badge className="ml-2 rounded-full bg-primary/15 text-primary">{tickets.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-4">
                          <div className="rounded-2xl border bg-background/60 p-4 shadow-sm">
                            <div className="text-sm font-semibold">Nuevo ticket</div>

                            <div className="mt-3 grid grid-cols-1 gap-2">
                              <Input value={ticketDraft.titulo} onChange={(e) => setTicketDraft((s) => ({ ...s, titulo: e.target.value }))} placeholder="Título" className="h-9 rounded-xl" />
                              <div className="grid grid-cols-2 gap-2">
                                <Input value={ticketDraft.estado} onChange={(e) => setTicketDraft((s) => ({ ...s, estado: e.target.value as QuoteTicket["estado"] }))} placeholder="Estado: abierto|en_progreso|cerrado" className="h-9 rounded-xl" />
                                <Input value={ticketDraft.url} onChange={(e) => setTicketDraft((s) => ({ ...s, url: e.target.value }))} placeholder="URL (opcional)" className="h-9 rounded-xl" />
                              </div>
                              <Textarea value={ticketDraft.descripcion} onChange={(e) => setTicketDraft((s) => ({ ...s, descripcion: e.target.value }))} placeholder="Descripción (opcional)" />
                              <div className="flex justify-end">
                                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={addTicket} disabled={busy}>
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
                                      {t.descripcion ? <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{t.descripcion}</div> : null}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="rounded-full">{t.estado || "abierto"}</Badge>
                                      {t.url ? (
                                        <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.open(t.url, "_blank", "noopener,noreferrer")}>
                                          <ExternalLink className="h-4 w-4" />
                                          Ver
                                        </Button>
                                      ) : null}
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => putMutation.mutate({ op: "removeTicket", uid: t.uid })} disabled={busy} title="Eliminar">
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
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}