"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { DndContext, DragEndEvent, closestCorners } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { RejectionReasonModal, RejectionFormData } from './RejectionReasonModal';

// Interfaces
interface Client {
    _id: string;
    nombreCompleto: string;
    etapa: string;
}
type Columns = Record<string, Client[]>;
interface MovingClientInfo {
    clientId: string;
    targetStage: string;
}

export function KanbanBoard() {
    const queryClient = useQueryClient();
    const [columns, setColumns] = useState<Columns>({});
    
    // --- NUEVOS ESTADOS para manejar el modal ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [movingClientInfo, setMovingClientInfo] = useState<MovingClientInfo | null>(null);

    const { data: clientes, isLoading } = useQuery<Client[]>({
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
            columnOrder.forEach(stage => {
                initialColumns[stage] = clientes.filter(c => c.etapa === stage);
            });
            setColumns(initialColumns);
        }
    }, [clientes]);

    // --- MUTACIÓN ACTUALIZADA para aceptar motivo de rechazo ---
    const updateClientStage = useMutation({
        mutationFn: async (data: { clientId: string, updates: Partial<Client> & RejectionFormData }) => {
            return axios.put(`/api/clientes/${data.clientId}`, data.updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clientes'] });
        },
        onError: (error) => console.error("Error al actualizar la etapa:", error)
    });

    // --- NUEVA LÓGICA para manejar el envío del modal ---
    const handleRejectionSubmit = (rejectionData: RejectionFormData) => {
        if (!movingClientInfo) return;

        const { clientId, targetStage } = movingClientInfo;

        // Actualización optimista de la UI
        setColumns(prev => {
            const newColumns = { ...prev };
            const sourceStage = Object.keys(newColumns).find(key => newColumns[key].some(c => c._id === clientId));
            if (!sourceStage) return prev;
            
            const clientIndex = newColumns[sourceStage].findIndex(c => c._id === clientId);
            const [movedClient] = newColumns[sourceStage].splice(clientIndex, 1);
            
            movedClient.etapa = targetStage;
            newColumns[targetStage].push(movedClient);
            return newColumns;
        });
        
        // Llamada a la API con todos los datos
        updateClientStage.mutate({ 
            clientId, 
            updates: { etapa: targetStage, ...rejectionData } 
        });

        setIsModalOpen(false);
        setMovingClientInfo(null);
    };

    // --- LÓGICA DE onDragEnd MODIFICADA ---
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        const sourceStage = Object.keys(columns).find(key => columns[key].some(c => c._id === activeId));
        if (!sourceStage || sourceStage === overId) return;

        // Si se mueve a la columna "Perdido", abrimos el modal
        if (overId === 'Perdido') {
            setMovingClientInfo({ clientId: activeId, targetStage: overId });
            setIsModalOpen(true);
        } else {
            // Si se mueve a cualquier otra columna, funciona como antes
            setColumns(prev => {
                const newColumns = { ...prev };
                const clientIndex = newColumns[sourceStage].findIndex(c => c._id === activeId);
                const [movedClient] = newColumns[sourceStage].splice(clientIndex, 1);
                movedClient.etapa = overId;
                newColumns[overId].push(movedClient);
                return newColumns;
            });
            updateClientStage.mutate({ clientId: activeId, updates: { etapa: overId, motivoRechazo: "" } });
        }
    };
    
    if (isLoading) return <div className="p-10 text-center">Cargando pipeline...</div>;

    return (
        <>
            <RejectionReasonModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleRejectionSubmit}
                isSubmitting={updateClientStage.isPending}
            />

            <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
                <div className="flex gap-4 p-4 overflow-x-auto h-[calc(100vh-150px)] items-start">
                    <SortableContext items={columnOrder}>
                        {columnOrder.map(columnId => (
                            <KanbanColumn
                                key={columnId}
                                id={columnId}
                                title={columnId}
                                clients={columns[columnId] || []}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>
        </>
    );
}