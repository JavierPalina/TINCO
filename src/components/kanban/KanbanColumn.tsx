"use client";

import { useMemo } from 'react';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { ClientCard, ClientCardProps } from './ClientCard';
import { Users, DollarSign } from 'lucide-react';

interface Props {
    id: string;
    title: string;
    clients: ClientCardProps[];
}

export function KanbanColumn({ id, title, clients }: Props) {
    const { setNodeRef } = useSortable({ id });
    const clientIds = useMemo(() => clients.map(c => c._id), [clients]);
    const totalCotizadoEnColumna = useMemo(() => {
        return clients.reduce((sum, client) => sum + (client.ultimaCotizacionMonto || 0), 0);
    }, [clients]);

    return (
        <div className="w-80 flex-shrink-0">
            <div className="p-3 mb-2 rounded-t-lg bg-muted/50 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">{title}</h2>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5" title="Suma de las últimas cotizaciones en esta etapa">
                        <DollarSign className="h-4 w-4" />
                        <span>820.000</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Cantidad de clientes en esta etapa">
                        <Users className="h-4 w-4" />
                        <span>{clients.length}</span>
                    </div>
                </div>
            </div>
            
            <div ref={setNodeRef} className="p-2 h-full min-h-[200px] overflow-y-auto bg-muted/50 rounded-b-lg">
                <SortableContext items={clientIds}>
                    {clients.map(client => (
                        <ClientCard key={client._id} client={client} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}