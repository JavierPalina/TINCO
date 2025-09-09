"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { useDebounce } from 'use-debounce';

import { KanbanColumn } from './KanbanColumn';
import { RejectionReasonModal, RejectionFormData } from './RejectionReasonModal';
import { ClientCard, ClientCardProps } from './ClientCard';
import { PipelineFilters } from './PipelineFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Columns = Record<string, ClientCardProps[]>;
interface MovingClientInfo {
  clientId: string;
  targetStage: string;
}

// --- SOLUCIÓN ---
// Se mueve columnOrder fuera del componente.
// Ahora es una constante estable y no causará que el useEffect se ejecute infinitamente.
const columnOrder: string[] = ['Nuevo', 'Contactado', 'Cotizado', 'Negociación', 'Ganado', 'Perdido'];

export function KanbanBoard() {
  const queryClient = useQueryClient();
  const [columns, setColumns] = useState<Columns>({});
  const [activeClient, setActiveClient] = useState<ClientCardProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [movingClientInfo, setMovingClientInfo] = useState<MovingClientInfo | null>(null);

  const [filters, setFilters] = useState({ searchTerm: '', prioridad: '' });
  const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

  const { data: prioridadesUnicas } = useQuery<string[]>({
    queryKey: ['prioridades'],
    queryFn: async () => {
      const { data } = await axios.get('/api/clientes/prioridades');
      return data.data;
    },
  });

  const queryKey = ['clientes', debouncedSearchTerm, filters.prioridad];
  const { data: clientes, isLoading, isFetching } = useQuery<ClientCardProps[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get('/api/clientes', {
          params: { searchTerm: debouncedSearchTerm, prioridad: filters.prioridad }
      });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (clientes) {
      const initialColumns: Columns = {};
      // Usamos la constante definida afuera
      columnOrder.forEach(stage => initialColumns[stage] = []);
      clientes.forEach(client => {
          if(initialColumns[client.etapa]) {
              initialColumns[client.etapa].push(client);
          }
      });
      setColumns(initialColumns);
    }
    // Ahora, como 'columnOrder' es estable, este useEffect solo se ejecutará cuando 'clientes' cambie.
  }, [clientes]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

  const updateClientStage = useMutation({
    mutationFn: async (data: { clientId: string, updates: Partial<ClientCardProps> & Partial<RejectionFormData> }) => {
        return axios.put(`/api/clientes/${data.clientId}`, data.updates);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clientes'] }),
    onError: (error) => console.error("Error al actualizar la etapa:", error)
  });

  const handleRejectionSubmit = (rejectionData: RejectionFormData) => {
    if (!movingClientInfo) return;
    const { clientId, targetStage } = movingClientInfo;

    updateClientStage.mutate({ 
        clientId, 
        updates: { etapa: targetStage, ...rejectionData } 
    });

    setIsModalOpen(false);
    setMovingClientInfo(null);
  };
  
  const findContainer = (id: string) => {
    if (id in columns) return id;
    return Object.keys(columns).find(key => columns[key].some(item => item._id === id));
  }

  const handleDragStart = (event: DragStartEvent) => {
    const client = event.active.data.current?.client as ClientCardProps;
    if(client) setActiveClient(client);
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return;
    }

    setColumns(prev => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        const activeIndex = activeItems.findIndex(item => item._id === activeId);
        
        if (activeIndex === -1) {
            return prev;
        }

        const overIndex = over.data.current?.type === 'ClientCard' 
        ? overItems.findIndex(item => item._id === overId)
        : overItems.length;

        const newColumns = {...prev};
        const [movedItem] = newColumns[activeContainer].splice(activeIndex, 1);
        newColumns[overContainer].splice(overIndex, 0, movedItem);
        return newColumns;
    });
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveClient(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const sourceStage = findContainer(active.id.toString());
    const targetStage = findContainer(over.id.toString());

    if (!sourceStage || !targetStage || sourceStage === targetStage) return;

    if (targetStage === 'Perdido') {
        queryClient.invalidateQueries({ queryKey: ['clientes'] });
        setMovingClientInfo({ clientId: activeId, targetStage });
        setIsModalOpen(true);
    } else {
        updateClientStage.mutate({ clientId: activeId, updates: { etapa: targetStage, motivoRechazo: "" } });
    }
  }
  
  const handleFilterChange = (name: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  if (isLoading) return <div className="p-10 text-center flex justify-center items-center h-[calc(100vh-80px)]"><Loader2 className="animate-spin h-8 w-8" /></div>;

  return (
    <>
      <div className="p-4 border-b">
        <h1 className="text-3xl font-bold">Pipeline de Ventas</h1>
      </div>
    
    <div className="flex flex-col h-[calc(100vh-80px)] pt-2">
      <PipelineFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        prioridadesUnicas={prioridadesUnicas || []}
      />

      <RejectionReasonModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); queryClient.invalidateQueries({ queryKey: ['clientes'] }); }} onSubmit={handleRejectionSubmit} isSubmitting={updateClientStage.isPending} />
      
      {/* --- VISTA DE ESCRITORIO (KANBAN) --- */}
      <div className={cn("hidden md:flex flex-grow transition-opacity", isFetching ? "opacity-50" : "opacity-100")}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 p-4 h-full items-start overflow-x-auto w-full">
              {columnOrder.map(columnId => (
                  <KanbanColumn key={columnId} id={columnId} title={columnId} clients={columns[columnId] || []} />
              ))}
          </div>
          {typeof document !== 'undefined' && createPortal(
              <DragOverlay>{activeClient ? <ClientCard client={activeClient} /> : null}</DragOverlay>,
              document.body
          )}
        </DndContext>
      </div>

      {/* --- VISTA MÓVIL (PESTAÑAS) --- */}
      <div className={cn("md:hidden flex-grow p-2 transition-opacity", isFetching ? "opacity-50" : "opacity-100")}>
        <Tabs defaultValue={columnOrder[0]} className="h-full flex flex-col">
            <TabsList className="w-full overflow-x-auto justify-start">
                {columnOrder.map(columnId => (
                    <TabsTrigger key={columnId} value={columnId}>{columnId} ({columns[columnId]?.length || 0})</TabsTrigger>
                ))}
            </TabsList>
            <div className="flex-grow overflow-y-auto mt-2">
                {columnOrder.map(columnId => (
                    <TabsContent key={columnId} value={columnId}>
                        {columns[columnId]?.length > 0 ? (
                            columns[columnId].map(client => <ClientCard key={client._id} client={client} />)
                        ) : (
                            <p className="text-center text-muted-foreground p-4">No hay clientes en esta etapa.</p>
                        )}
                    </TabsContent>
                ))}
            </div>
        </Tabs>
      </div>
    </div>
    </>
  );
}