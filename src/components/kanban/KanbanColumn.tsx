"use client";

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { ClientCard, ClientCardProps } from './ClientCard';
import { useMemo } from 'react';

interface Props {
    id: string;
    title: string;
    clients: ClientCardProps[];
}

export function KanbanColumn({ id, title, clients }: Props) {
    const { setNodeRef } = useSortable({ id });
    const clientIds = useMemo(() => clients.map(c => c._id), [clients]);

    return (
        <div className="w-80 flex-shrink-0">
            <div className="flex items-center justify-between p-3 mb-2">
                <h2 className="font-semibold text-lg">{title}</h2>
                <span className="text-sm font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                    {clients.length}
                </span>
            </div>
            <div ref={setNodeRef} className="bg-muted/50 rounded-lg p-2 h-full min-h-[200px] overflow-y-auto">
                <SortableContext items={clientIds}>
                    {clients.map(client => (
                        <ClientCard key={client._id} client={client} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}