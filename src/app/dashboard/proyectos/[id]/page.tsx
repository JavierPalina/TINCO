"use client";

import { useMemo, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Download, FileDown } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ProyectoDTO } from "@/types/proyecto";
import type { PdfStage } from "@/lib/pdf/generateProyectoPdf";

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
    case "Taller":         return "bg-orange-500 hover:bg-orange-600";
    case "Logística":      return "bg-blue-500 hover:bg-blue-600";
    case "Completado":     return "bg-green-600 hover:bg-green-700";
    case "Visita Técnica": return "bg-purple-500 hover:bg-purple-600";
    case "Medición":       return "bg-purple-600 hover:bg-purple-700";
    case "Verificación":   return "bg-yellow-600 hover:bg-yellow-700 text-black";
    case "Depósito":       return "bg-slate-600 hover:bg-slate-700";
    default:               return "bg-gray-400 hover:bg-gray-500";
  }
};

const STAGE_LABELS: Record<PdfStage, string> = {
  visitaTecnica: "Visita Técnica",
  medicion:      "Medición",
  verificacion:  "Verificación",
  taller:        "Taller",
  deposito:      "Depósito",
  logistica:     "Logística",
};

const ALL_STAGES: PdfStage[] = [
  "visitaTecnica",
  "medicion",
  "verificacion",
  "taller",
  "deposito",
  "logistica",
];

export default function ProyectoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: proyecto, isLoading, isError } = useQuery({
    queryKey: ["proyecto", projectId],
    queryFn: () => fetchProyecto(projectId),
    enabled: !!projectId,
  });

  const defaultTab = useMemo(
    () => getDefaultTab(proyecto?.estadoActual),
    [proyecto?.estadoActual],
  );

  const handleDownloadPdf = useCallback(
    async (stages: PdfStage[], label: string) => {
      if (!proyecto) return;
      setPdfLoading(true);
      toast.message(`Generando PDF: ${label}...`);
      try {
        const { generateProyectoPdf } = await import("@/lib/pdf/generateProyectoPdf");
        const suffix = stages.length === 1 ? STAGE_LABELS[stages[0]] : "completo";
        await generateProyectoPdf(
          proyecto,
          stages,
          `${proyecto.numeroOrden}-${suffix}.pdf`,
        );
        toast.success("PDF descargado");
      } catch {
        toast.error("Error al generar el PDF");
      } finally {
        setPdfLoading(false);
      }
    },
    [proyecto],
  );

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

  const cliente = (
    proyecto.cliente && typeof proyecto.cliente === "object"
      ? (proyecto.cliente as ClientePopulado)
      : null
  ) as ClientePopulado | null;

  const estadoLabel =
    typeof proyecto.estadoActual === "string" && proyecto.estadoActual.trim() !== ""
      ? proyecto.estadoActual
      : "Sin estado";

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start gap-4 justify-between border-b pb-6">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mt-0.5 flex-shrink-0"
          >
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
                <span>
                  Cliente:{" "}
                  <span className="font-semibold text-foreground">{cliente.nombreCompleto}</span>
                </span>
              )}
              {cliente?.telefono && (
                <span>
                  Tel:{" "}
                  <span className="font-semibold text-foreground">{cliente.telefono}</span>
                </span>
              )}
              {cliente?.direccion && (
                <span>
                  Dir:{" "}
                  <span className="font-semibold text-foreground">{cliente.direccion}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PDF download dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-shrink-0" disabled={pdfLoading}>
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descargar PDF
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Documento completo
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleDownloadPdf(ALL_STAGES, "Todas las etapas")}
              className="flex items-center gap-2 font-medium"
            >
              <FileDown className="h-4 w-4 text-primary" />
              Todas las etapas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Por etapa
            </DropdownMenuLabel>
            {ALL_STAGES.map((stage) => (
              <DropdownMenuItem
                key={stage}
                onClick={() => handleDownloadPdf([stage], STAGE_LABELS[stage])}
                className="flex items-center gap-2"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                {STAGE_LABELS[stage]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-1 mb-2">
          {[
            { value: "visita-tecnica", label: "Visita Técnica", n: 1 },
            { value: "medicion",       label: "Medición",       n: 2 },
            { value: "verificacion",   label: "Verificación",   n: 3 },
            { value: "taller",         label: "Taller",         n: 4 },
            { value: "deposito",       label: "Depósito",       n: 5 },
            { value: "logistica",      label: "Logística",      n: 6 },
          ].map(({ value, label, n }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex flex-col items-center py-2 px-1 text-xs gap-0.5"
            >
              <span className="text-[10px] font-bold opacity-50">{n}</span>
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="visita-tecnica" className="mt-4">
          <VisitaTecnicaView proyecto={proyecto} onDeleted={() => router.back()} />
        </TabsContent>
        <TabsContent value="medicion" className="mt-4">
          <MedicionView proyecto={proyecto} onDeleted={() => router.back()} />
        </TabsContent>
        <TabsContent value="verificacion" className="mt-4">
          <VerificacionView proyecto={proyecto} onDeleted={() => router.back()} />
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
