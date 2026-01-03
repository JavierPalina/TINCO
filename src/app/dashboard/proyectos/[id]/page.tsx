"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Proyecto: {proyecto.numeroOrden}</h1>

            <div className="flex flex-col md:flex-row gap-4 text-lg mt-2">
              <span>
                Cliente:{" "}
                <span className="font-semibold">{cliente?.nombreCompleto ?? "—"}</span>
              </span>

              <span>
                Teléfono:{" "}
                <span className="font-semibold">{cliente?.telefono ?? "—"}</span>
              </span>

              <span>
                Dirección:{" "}
                <span className="font-semibold">{cliente?.direccion ?? "—"}</span>
              </span>

              <span className="inline-flex items-center gap-2">
                Estado:
                <Badge className={`text-lg ${getEstadoBadgeColor(estadoLabel)}`}>
                  {estadoLabel}
                </Badge>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="text-sm text-muted-foreground hover:underline"
            onClick={() => router.back()}
          >
            Volver
          </button>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-6">
          <TabsTrigger value="visita-tecnica">1. Visita Técnica</TabsTrigger>
          <TabsTrigger value="medicion">2. Medición</TabsTrigger>
          <TabsTrigger value="verificacion">3. Verificación</TabsTrigger>
          <TabsTrigger value="taller">4. Taller</TabsTrigger>
          <TabsTrigger value="deposito">5. Depósito</TabsTrigger>
          <TabsTrigger value="logistica">6. Logística</TabsTrigger>
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
