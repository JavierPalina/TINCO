"use client";

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { ClientCard } from './ClientCard';

interface Client {
    _id: string;
    nombreCompleto: string;
}

interface Props {
    id: string;
    title: string;
    clients: Client[];
}

export function KanbanColumn({ id, title, clients }: Props) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div ref={setNodeRef} className="w-72 bg-muted rounded-lg p-2 flex-shrink-0 flex flex-col">
            <h2 className="font-bold text-lg p-2 mb-2">{title}</h2>
            {/* Este contexto le dice a dnd-kit qué elementos son ordenables dentro de esta columna */}
            <SortableContext id={id} items={clients.map(c => c._id)}>
                <div className="space-y-2 flex-grow">
                    {clients.map(client => (
                        <ClientCard key={client._id} client={client} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}