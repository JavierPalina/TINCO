"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { RejectionReasonModal, RejectionFormData } from './RejectionReasonModal';
import { ClientCard, ClientCardProps } from './ClientCard';
import { createPortal } from 'react-dom';

type Columns = Record<string, ClientCardProps[]>;
interface MovingClientInfo {
    clientId: string;
    targetStage: string;
}

export function KanbanBoard() {
    const queryClient = useQueryClient();
    const [columns, setColumns] = useState<Columns>({});
    const [activeClient, setActiveClient] = useState<ClientCardProps | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [movingClientInfo, setMovingClientInfo] = useState<MovingClientInfo | null>(null);

    const { data: clientes, isLoading } = useQuery<ClientCardProps[]>({
        queryKey: ['clientes'],
        queryFn: async () => {
            const { data } = await axios.get('/api/clientes');
            return data.data;
        },
    });

    const columnOrder: string[] = ['Nuevo', 'Contactado', 'Cotizado', 'Negociación', 'Ganado', 'Perdido'];

    useEffect(() => {
        if (clientes) {
            const initialColumns: Columns = {};
            columnOrder.forEach(stage => initialColumns[stage] = []);
            clientes.forEach(client => {
                if(initialColumns[client.etapa]) {
                    initialColumns[client.etapa].push(client);
                }
            });
            setColumns(initialColumns);
        }
    }, [clientes]);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 10 },
    }));

    const updateClientStage = useMutation({
        mutationFn: async (data: { clientId: string, updates: Partial<ClientCardProps> & Partial<RejectionFormData> }) => {
            return axios.put(`/api/clientes/${data.clientId}`, data.updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
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
    
    function findContainer(id: string) {
        if (id in columns) return id;
        return Object.keys(columns).find(key => columns[key].some(item => item._id === id));
    }

    function handleDragStart(event: DragStartEvent) {
        const client = event.active.data.current?.client as ClientCardProps;
        if(client) setActiveClient(client);
    }

    function handleDragOver(event: DragOverEvent) {
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
            
            // --- ESTA ES LA VALIDACIÓN CLAVE QUE SOLUCIONA EL ERROR ---
            if (activeIndex === -1) {
                return prev; // Si no se encuentra el cliente, no hacemos nada y evitamos el error.
            }

            let overIndex = overItems.findIndex(item => item._id === overId);
            if (overIndex < 0) {
                overIndex = overItems.length; // Si se arrastra sobre la columna, se añade al final
            }

            const newColumns = {...prev};
            const [movedItem] = newColumns[activeContainer].splice(activeIndex, 1);
            newColumns[overContainer].splice(overIndex, 0, movedItem);
            return newColumns;
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveClient(null);
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id.toString();
        const sourceStage = findContainer(active.id.toString());
        const targetStage = findContainer(over.id.toString());

        if (!sourceStage || !targetStage || sourceStage === targetStage) return;

        if (targetStage === 'Perdido') {
            // Revertimos el estado visual temporalmente hasta que se confirme en el modal
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
            setMovingClientInfo({ clientId: activeId, targetStage });
            setIsModalOpen(true);
        } else {
            updateClientStage.mutate({ clientId: activeId, updates: { etapa: targetStage, motivoRechazo: "" } });
        }
    }
    
    if (isLoading) return <div className="p-10 text-center">Cargando pipeline...</div>;

    return (
        <>
            <RejectionReasonModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    // Si el usuario cierra el modal sin confirmar, recargamos los datos para revertir el cambio visual
                    queryClient.invalidateQueries({ queryKey: ['clientes'] });
                }}
                onSubmit={handleRejectionSubmit}
                isSubmitting={updateClientStage.isPending}
            />
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 p-4 h-[calc(100vh-120px)] items-start overflow-x-auto">
                    {columnOrder.map(columnId => (
                        <KanbanColumn
                            key={columnId}
                            id={columnId}
                            title={columnId}
                            clients={columns[columnId] || []}
                        />
                    ))}
                </div>
                {typeof document !== 'undefined' && createPortal(
                    <DragOverlay>
                        {activeClient ? <ClientCard client={activeClient} /> : null}
                    </DragOverlay>,
                    document.body
                )}
            </DndContext>
        </>
    );
}