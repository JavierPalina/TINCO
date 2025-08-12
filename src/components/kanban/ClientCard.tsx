"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';

export interface ClientCardProps {
    _id: string;
    nombreCompleto: string;
    etapa: string;
    // You can add more props like 'telefono', 'montoOportunidad', etc.
}

export function ClientCard({ client }: { client: ClientCardProps }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: client._id, data: { type: 'Client', client } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // Make it more transparent when dragging
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="mb-3 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
                    <CardTitle className="text-sm font-medium leading-none">
                        <Link href={`/dashboard/clientes/${client._id}`} className="hover:underline">
                            {client.nombreCompleto}
                        </Link>
                    </CardTitle>
                    {/* Grip handle for better UX, indicating it's draggable */}
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
}