"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { CSVLink } from "react-csv";
import { MoreHorizontal, Pencil, Trash2, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EditClientDialog } from "./EditClientDialog";
import { Client } from "@/types/client";

const csvHeaders = [
  { label: "Nombre Completo", key: "nombreCompleto" },
  { label: "Teléfono", key: "telefono" },
  { label: "Email", key: "email" },
  { label: "Empresa", key: "empresa" },
  { label: "Prioridad", key: "prioridad" },
  { label: "Etapa", key: "etapa" },
];

type ClientWithExtras = Client & {
  creadoPor?: string;
  ultimoContacto?: string | Date | null;
  ultimaCotizacionMonto?: number | null;
  dni?: string | null;
  cuil?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  pais?: string | null;
  razonSocial?: string | null;
  contactoEmpresa?: string | null;
  direccionEmpresa?: string | null;
  ciudadEmpresa?: string | null;
  paisEmpresa?: string | null;
};

const safeStr = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s.length ? s : "-";
};

const moneyARS = (n: unknown) => {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "-";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(num);
};

const formatDate = (d: unknown) => {
  if (!d) return "-";
  const dt = d instanceof Date ? d : new Date(String(d));
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("es-AR", { year: "numeric", month: "short", day: "2-digit" });
};

const fmtDateTime = (d: Date) =>
  d.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const getPrimaryRgb = () => {
  if (typeof window === "undefined") return { r: 16, g: 185, b: 129 };
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  const cleaned = raw.replace(/^hsl\(|\)$/g, "").trim();
  const parts = cleaned.split(/\s+/);
  const h = Number(parts[0]);
  const s = Number(String(parts[1] ?? "").replace("%", ""));
  const l = Number(String(parts[2] ?? "").replace("%", ""));
  if (![h, s, l].every((x) => Number.isFinite(x))) return { r: 16, g: 185, b: 129 };
  return hslToRgb(h, s, l);
};

const fetchAsDataUrl = async (src: string) => {
  const res = await fetch(src);
  if (!res.ok) throw new Error("No se pudo cargar el logo");
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el logo"));
    reader.readAsDataURL(blob);
  });
};

async function generateClientPdf(client: ClientWithExtras) {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const primary = getPrimaryRgb();

  const marginX = 14;
  const contentW = pageW - marginX * 2;

  const setPrimary = () => doc.setTextColor(primary.r, primary.g, primary.b);
  const setMuted = () => doc.setTextColor(107, 114, 128);
  const setDark = () => doc.setTextColor(17, 24, 39);

  const ensureSpace = (needed: number, y: number) => {
    if (y + needed > pageH - 18) {
      doc.addPage();
      return 18;
    }
    return y;
  };

  const setOpacity = (opacity: number) => {
    const d = doc as unknown as {
      GState?: new (o: { opacity: number }) => unknown;
      setGState?: (g: unknown) => void;
    };

    if (d.GState && d.setGState) {
      d.setGState(new d.GState({ opacity }));
    }
  };

  doc.setFillColor(249, 250, 251);
  doc.rect(0, 0, pageW, 34, "F");

  doc.setDrawColor(primary.r, primary.g, primary.b);
  doc.setLineWidth(0.8);
  doc.line(marginX, 34, pageW - marginX, 34);

  try {
    const logoDataUrl = await fetchAsDataUrl("/logo.png");
    const imgH = 14;
    const imgW = 46;
    doc.addImage(logoDataUrl, "PNG", marginX, 10, imgW, imgH);
  } catch {}

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setPrimary();
  doc.text("Ficha de Cliente", pageW - marginX, 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setMuted();
  doc.text(`Generado: ${fmtDateTime(new Date())}`, pageW - marginX, 22, { align: "right" });

  let y = 44;

  const sectionCard = (title: string, height: number) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginX, y, contentW, height, 3, 3, "FD");

    doc.setFillColor(primary.r, primary.g, primary.b);
    setOpacity(0.08);
    doc.roundedRect(marginX, y, contentW, 9, 3, 3, "F");
    setOpacity(1);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setPrimary();
    doc.text(title, marginX + 4, y + 6.2);

    return y + 14;
  };

  const kv = (label: string, value: string, x: number, y0: number, w: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.7);
    setMuted();
    doc.text(label.toUpperCase(), x, y0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    setDark();

    const lines = doc.splitTextToSize(value, w);
    doc.text(lines, x, y0 + 5);

    return Math.max(12, lines.length * 5 + 6);
  };

  const twoCol = (left: [string, string], right: [string, string], y0: number) => {
    const gap = 10;
    const colW = (contentW - gap) / 2;
    const xL = marginX + 6;
    const xR = marginX + 6 + colW + gap;

    const h1 = kv(left[0], left[1], xL, y0, colW);
    const h2 = kv(right[0], right[1], xR, y0, colW);

    return y0 + Math.max(h1, h2) + 3;
  };

  y = ensureSpace(80, y);
  const cardH1 = 72;
  let innerY = sectionCard("Datos personales", cardH1);

  innerY = twoCol(["Nombre completo", safeStr(client.nombreCompleto)], ["Origen", safeStr(client.origenContacto)], innerY);
  innerY = twoCol(["Teléfono", safeStr(client.telefono)], ["Email", safeStr(client.email)], innerY);
  innerY = twoCol(["DNI", safeStr(client.dni)], ["CUIL", safeStr(client.cuil)], innerY);

  y += cardH1 + 10;

  y = ensureSpace(60, y);
  const cardH2 = 50;
  innerY = sectionCard("Dirección", cardH2);
  innerY = twoCol(["Dirección", safeStr(client.direccion)], ["Ciudad", safeStr(client.ciudad)], innerY);
  innerY = twoCol(["País", safeStr(client.pais)], ["Empresa", safeStr(client.empresa || "Sin empresa")], innerY);

  y += cardH2 + 10;

  y = ensureSpace(86, y);
  const cardH3 = 72;
  innerY = sectionCard("Datos de empresa", cardH3);
  innerY = twoCol(["Razón social", safeStr(client.razonSocial)], ["Contacto", safeStr(client.contactoEmpresa)], innerY);
  innerY = twoCol(["Dirección empresa", safeStr(client.direccionEmpresa)], ["Ciudad empresa", safeStr(client.ciudadEmpresa)], innerY);
  innerY = twoCol(["País empresa", safeStr(client.paisEmpresa)], ["Última cotización", moneyARS(client.ultimaCotizacionMonto)], innerY);

  y += cardH3 + 10;

  y = ensureSpace(66, y);
  const cardH4 = 52;
  innerY = sectionCard("Registro y seguimiento", cardH4);
  innerY = twoCol(["Creado por", safeStr(client.creadoPor)], ["Fecha creación", formatDate((client as Client).createdAt)], innerY);
  innerY = twoCol(["Último contacto", formatDate(client.ultimoContacto)], ["ID Cliente", safeStr(client._id)], innerY);

  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(marginX, pageH - 16, pageW - marginX, pageH - 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setMuted();
  doc.text("TINCO • CRM", marginX, pageH - 10);
  doc.text(`Cliente: ${safeStr(client.nombreCompleto)}`, pageW - marginX, pageH - 10, { align: "right" });

  const filename = `cliente_${safeStr(client.nombreCompleto).replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

export function ClientActions({
  client,
  prioridadesOptions,
}: {
  client: Client;
  prioridadesOptions: string[];
}) {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => axios.delete(`/api/clientes/${clientId}`),
    onSuccess: () => {
      toast.success("Cliente eliminado con éxito");
      // ✅ importante: invalidar no-exacto para cubrir filtros/sucursal
      queryClient.invalidateQueries({ queryKey: ["clientes"], exact: false });
    },
    onError: () => {
      toast.error("Error al eliminar el cliente.");
    },
  });

  const handleDelete = () => deleteMutation.mutate(client._id);

  const handleDownloadPdf = async () => {
    try {
      toast.message("Generando PDF...");
      await generateClientPdf(client as ClientWithExtras);
      toast.success("PDF descargado.");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF.");
    }
  };

  return (
    <>
      <EditClientDialog
        client={client}
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
        prioridadesOptions={prioridadesOptions}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar Cliente
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDownloadPdf}>
            <FileText className="h-4 w-4" />
            Descargar PDF (Ficha)
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <CSVLink
              data={[client]}
              headers={csvHeaders}
              filename={`cliente_${safeStr(client?.nombreCompleto).replace(/\s+/g, "_")}.csv`}
              className="flex items-center w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar CSV
            </CSVLink>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Cliente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
