"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { IProyecto } from '@/models/Proyecto'; // Ajusta la ruta si es necesario
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Importamos los 6 componentes de formulario (nos darán error hasta que los creemos)
// import { FormVisitaTecnica } from '@/components/proyectos/FormVisitaTecnica';
import { FormMedicion } from '@/components/proyectos/FormMedicion';
import { FormVerificacion } from '@/components/proyectos/FormVerificacion';
import { FormTaller } from '@/components/proyectos/FormTaller';
import { FormDeposito } from '@/components/proyectos/FormDeposito';
import { FormLogistica } from '@/components/proyectos/FormLogistica';

async function fetchProyecto(id: string): Promise<IProyecto> {
  const { data } = await axios.get(`/api/proyectos/${id}`);
  return data.data;
}

// Mapa para saber qué tab activar según el estado
const estadoATab: Record<string, string> = {
  'Visita Técnica': 'visita-tecnica',
  'Medición': 'medicion',
  'Verificación': 'verificacion',
  'Taller': 'taller',
  'Depósito': 'deposito',
  'Logística': 'logistica',
  'Instalación': 'logistica',
  'Retiro Cliente': 'logistica',
  'Completado': 'logistica',
};

export default function ProyectoDetallePage() {
  const params = useParams();
  const projectId = params.id as string;

  const { data: proyecto, isLoading, isError } = useQuery({
    queryKey: ['proyecto', projectId],
    queryFn: () => fetchProyecto(projectId),
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (isError || !proyecto) {
    return <div className="p-10 text-red-500">Error al cargar el proyecto o no se encontró.</div>;
  }
  
  const defaultTab = estadoATab[proyecto.estadoActual] || 'visita-tecnica';

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Proyecto: {proyecto.numeroOrden}</h1>
        <div className="flex flex-col md:flex-row gap-4 text-lg mt-2">
          <span>Cliente: <span className="font-semibold">{(proyecto.cliente as any)?.nombreCompleto}</span></span>
          <span>Teléfono: <span className="font-semibold">{(proyecto.cliente as any)?.telefono}</span></span>
          <span>Dirección: <span className="font-semibold">{(proyecto.cliente as any)?.direccion}</span></span>
          <span>Estado: <Badge className="text-lg">{proyecto.estadoActual}</Badge></span>
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

        {/* <TabsContent value="visita-tecnica" className="mt-4">
          <FormVisitaTecnica proyecto={proyecto} />
        </TabsContent> */}
        
        <TabsContent value="medicion" className="mt-4">
          <FormMedicion proyecto={proyecto} />
        </TabsContent>
        
        <TabsContent value="verificacion" className="mt-4">
          <FormVerificacion proyecto={proyecto} />
        </TabsContent>
        
        <TabsContent value="taller" className="mt-4">
          <FormTaller proyecto={proyecto} />
        </TabsContent>
        
        <TabsContent value="deposito" className="mt-4">
          <FormDeposito proyecto={proyecto} />
        </TabsContent>
        
        <TabsContent value="logistica" className="mt-4">
          <FormLogistica proyecto={proyecto} />
        </TabsContent>
      </Tabs>
    </div>
  );
}