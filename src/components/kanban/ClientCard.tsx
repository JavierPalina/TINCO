"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface Client {
    _id: string;
    nombreCompleto: string;
    // Otros campos que necesites
}

export function ClientCard({ client }: { client: Client }) {
    // 1. Hook de dnd-kit que hace la magia
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: client._id });

    // 2. Estilos para la animación de movimiento
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        // 3. Conectamos los props del hook al elemento
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="mb-2 hover:shadow-lg cursor-grab active:cursor-grabbing">
                <CardHeader className="p-4">
                    <CardTitle className="text-sm font-medium">{client.nombreCompleto}</CardTitle>
                </CardHeader>
            </Card>
        </div>
    );
}