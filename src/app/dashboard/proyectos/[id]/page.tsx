"use client";

import { useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { ProyectoDTO } from "@/types/proyecto";

// VISTAS (solo lectura)
import { VisitaTecnicaView } from "@/components/proyectos/VisitaTecnicaView";
import { MedicionView } from "@/components/proyectos/MedicionView";
import { VerificacionView } from "@/components/proyectos/VerificacionView";
import { TallerView } from "@/components/proyectos/TallerView";
import { DepositoView } from "@/components/proyectos/DepositoView";
import { LogisticaView } from "@/components/proyectos/LogisticaView";

async function fetchProyecto(id: string): Promise<ProyectoDTO> {
  const { data } = await axios.get(`/api/proyectos/${id}`);
  return data.data as ProyectoDTO;
}

// Mapa para saber qué tab activar según el estado
const estadoATab: Record<string, string> = {
  "Visita Técnica": "visita-tecnica",
  Medición: "medicion",
  Verificación: "verificacion",
  Taller: "taller",
  Depósito: "deposito",
  Logística: "logistica",
  Instalación: "logistica",
  "Retiro Cliente": "logistica",
  Completado: "logistica",
};

// tipo mínimo para el cliente populado
type ClientePopulado = {
  nombreCompleto?: string;
  telefono?: string;
  direccion?: string;
};

function getDefaultTab(estadoActual: unknown): string {
  const key =
    typeof estadoActual === "string" && estadoActual.trim() !== ""
      ? estadoActual.trim()
      : "";

  return estadoATab[key] ?? "visita-tecnica";
}

const getEstadoBadgeColor = (estado?: string | null) => {
  if (!estado) return "bg-primary/15 text-primary hover:bg-primary/20";
  switch (estado) {
    case "Taller":
      return "bg-orange-500 hover:bg-orange-600";
    case "Logística":
      return "bg-blue-500 hover:bg-blue-600";
    case "Completado":
      return "bg-green-600 hover:bg-green-700";
    case "Visita Técnica":
      return "bg-purple-500 hover:bg-purple-600";
    case "Medición":
      return "bg-purple-600 hover:bg-purple-700";
    case "Verificación":
      return "bg-yellow-600 hover:bg-yellow-700 text-black";
    case "Depósito":
      return "bg-slate-600 hover:bg-slate-700";
    default:
      return "bg-gray-400 hover:bg-gray-500";
  }
};

export default function ProyectoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { data: proyecto, isLoading, isError } = useQuery({
    queryKey: ["proyecto", projectId],
    queryFn: () => fetchProyecto(projectId),
    enabled: !!projectId,
  });

  const defaultTab = useMemo(() => getDefaultTab(proyecto?.estadoActual), [proyecto?.estadoActual]);

  const handleDownloadPdf = useCallback(async () => {
    if (!proyecto) return;
    toast.message("Generando PDF...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pw = doc.internal.pageSize.getWidth();
      const mX = 15;
      let y = 20;

      const titulo = `Proyecto ${proyecto.numeroOrden}`;
      const clienteObj = typeof proyecto.cliente === "object" && proyecto.cliente ? proyecto.cliente as ClientePopulado : null;
      const line = (text: string, size = 10, bold = false) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        const lines = doc.splitTextToSize(String(text), pw - mX * 2) as string[];
        lines.forEach((l: string) => {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(l, mX, y);
          y += size * 0.45;
        });
        y += 2;
      };
      const section = (title: string) => {
        y += 4;
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFillColor(79, 165, 136);
        doc.rect(mX, y, pw - mX * 2, 7, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(title.toUpperCase(), mX + 3, y + 5);
        doc.setTextColor(0, 0, 0);
        y += 11;
      };
      const field = (label: string, value: unknown) => {
        if (value === null || value === undefined || value === "") return;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, mX, y);
        doc.setFont("helvetica", "normal");
        const txt = String(value);
        const lines = doc.splitTextToSize(txt, pw - mX * 2 - 40) as string[];
        doc.text(lines[0], mX + 40, y);
        y += 5;
        for (let i = 1; i < lines.length; i++) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(lines[i], mX + 40, y);
          y += 5;
        }
      };

      // Header
      line(titulo, 18, true);
      line(`Estado: ${proyecto.estadoActual ?? "Sin estado"}`, 12);
      if (clienteObj?.nombreCompleto) line(`Cliente: ${clienteObj.nombreCompleto}`, 11);
      if (clienteObj?.telefono) line(`Teléfono: ${clienteObj.telefono}`, 10);
      if (clienteObj?.direccion) line(`Dirección: ${clienteObj.direccion}`, 10);
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(mX, y, pw - mX, y);
      y += 6;

      // Visita técnica
      const vt = proyecto.visitaTecnica;
      if (Object.keys(vt).length > 0) {
        section("Visita Técnica");
        field("Fecha visita", vt.fechaVisita ? new Date(vt.fechaVisita as unknown as string).toLocaleDateString("es-AR") : "");
        field("Hora", vt.horaVisita as string);
        field("Tipo visita", vt.tipoVisita as string);
        field("Dirección", vt.direccion as string);
        field("Estado obra", vt.estadoObra as string);
        field("Material solicitado", vt.materialSolicitado as string);
        field("Color", vt.color as string);
        field("Recomendación técnica", vt.recomendacionTecnica as string);
        field("Estado tarea", vt.estadoTareaVisita as string);
        field("Observaciones", vt.observacionesTecnicas as string);
      }

      const etapas: [string, Record<string, unknown>][] = [
        ["Medición", proyecto.medicion as Record<string, unknown>],
        ["Verificación", proyecto.verificacion as Record<string, unknown>],
        ["Taller", proyecto.taller as Record<string, unknown>],
        ["Depósito", proyecto.deposito as Record<string, unknown>],
        ["Logística", proyecto.logistica as Record<string, unknown>],
      ];
      for (const [nombre, etapa] of etapas) {
        if (etapa && Object.keys(etapa).length > 0) {
          section(nombre);
          Object.entries(etapa).forEach(([k, v]) => {
            if (k.startsWith("_") || v === null || v === undefined || v === "") return;
            const label = k.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
            field(label.charAt(0).toUpperCase() + label.slice(1), Array.isArray(v) ? v.join(", ") : v);
          });
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado el ${new Date().toLocaleString("es-AR")}`, mX, 290);

      doc.save(`${proyecto.numeroOrden}.pdf`);
      toast.success("PDF descargado");
    } catch {
      toast.error("Error al generar el PDF");
    }
  }, [proyecto]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (isError || !proyecto) {
    return (
      <div className="p-10 text-red-500">
        Error al cargar el proyecto o no se encontró.
      </div>
    );
  }

  const cliente = (proyecto.cliente && typeof proyecto.cliente === "object"
    ? (proyecto.cliente as ClientePopulado)
    : null) as ClientePopulado | null;

  const estadoLabel =
    typeof proyecto.estadoActual === "string" && proyecto.estadoActual.trim() !== ""
      ? proyecto.estadoActual
      : "Sin estado";

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header mejorado */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-4 justify-between border-b pb-6">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="mt-0.5 flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">Proyecto: {proyecto.numeroOrden}</h1>
              <Badge className={`${getEstadoBadgeColor(estadoLabel)} text-sm px-3 py-1`}>
                {estadoLabel}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
              {cliente?.nombreCompleto && (
                <span>Cliente: <span className="font-semibold text-foreground">{cliente.nombreCompleto}</span></span>
              )}
              {cliente?.telefono && (
                <span>Tel: <span className="font-semibold text-foreground">{cliente.telefono}</span></span>
              )}
              {cliente?.direccion && (
                <span>Dir: <span className="font-semibold text-foreground">{cliente.direccion}</span></span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleDownloadPdf} variant="outline" className="flex-shrink-0">
          <Download className="h-4 w-4 mr-2" /> Descargar PDF
        </Button>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 mb-2">
          {[
            { value: "visita-tecnica", label: "Visita Técnica", n: 1 },
            { value: "medicion", label: "Medición", n: 2 },
            { value: "verificacion", label: "Verificación", n: 3 },
            { value: "taller", label: "Taller", n: 4 },
            { value: "deposito", label: "Depósito", n: 5 },
            { value: "logistica", label: "Logística", n: 6 },
          ].map(({ value, label, n }) => (
            <TabsTrigger key={value} value={value} className="flex flex-col items-center py-2 px-1 text-xs gap-0.5">
              <span className="text-[10px] font-bold opacity-50">{n}</span>
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visita-tecnica" className="mt-4">
          <VisitaTecnicaView
            proyecto={proyecto}
            onDeleted={() => {
              router.back();
            }}
          />
        </TabsContent>

        <TabsContent value="medicion" className="mt-4">
          <MedicionView
            proyecto={proyecto}
            onDeleted={() => {
              router.back();
            }}
          />
        </TabsContent>

        <TabsContent value="verificacion" className="mt-4">
          <VerificacionView
            proyecto={proyecto}
            onDeleted={() => {
              router.back();
            }}
          />
        </TabsContent>

        <TabsContent value="taller" className="mt-4">
          <TallerView proyecto={proyecto} />
        </TabsContent>

        <TabsContent value="deposito" className="mt-4">
          <DepositoView proyecto={proyecto} />
        </TabsContent>

        <TabsContent value="logistica" className="mt-4">
          <LogisticaView proyecto={proyecto} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
