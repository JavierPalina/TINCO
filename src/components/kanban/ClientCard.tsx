"use client";

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GripVertical, FileText, DollarSign, CalendarDays, MapPin, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ViewNotesDialog } from '../clientes/ViewNotesDialog';
import { WhatsAppButton } from '../clientes/WhatsAppButton';
import { EmailButton } from '../clientes/EmailButton';

export interface ClientCardProps {
    _id: string;
    nombreCompleto: string;
    email?: string;
    telefono: string;
    etapa: string;
    direccion?: string;
    creadoPor?: string;
    ultimaInteraccionTipo?: string;
    ultimaInteraccionFecha?: string;
    ultimaCotizacionMonto?: number;
    notas?: string;
}

export function ClientCard({ client }: { client: ClientCardProps }) {
    const [isNotesOpen, setNotesOpen] = useState(false);

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
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <>
            <ViewNotesDialog client={client as any} isOpen={isNotesOpen} onOpenChange={setNotesOpen} />
            <div ref={setNodeRef} style={style}>
                <Card className="mb-3 shadow-sm hover:shadow-lg transition-shadow duration-200 gap-0 py-2">
                    <CardHeader className="flex flex-row items-start justify-between p-3 space-y-0">
                        <div>
                            <CardTitle className="text-base font-semibold leading-none">
                                <Link href={`/dashboard/clientes/${client._id}`} className="hover:underline">
                                    {client.nombreCompleto}
                                </Link>
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                                <MapPin className="h-3 w-3" />
                                <span>{client.direccion || 'Sin dirección'}</span>
                            </CardDescription>
                        </div>
                        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardHeader>

                    <CardContent className="p-3 pt-0 text-sm space-y-3">
                        {/* --- ESTA ES LA NUEVA FILA COMBINADA --- */}
                        <div className="flex items-center justify-between text-muted-foreground">
                            <div className="flex items-center gap-1 text-xs">
                                <User className="h-3 w-3" />
                                <span>Creado por: {client.creadoPor || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-foreground">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <span>420.000</span>
                            </div>
                        </div>

                        {/* Última Interacción */}
                        <div className="flex items-center text-muted-foreground">
                            <CalendarDays className="h-4 w-4 mr-2 shrink-0" />
                            <div>
                                <p className="leading-tight">{client.ultimaInteraccionTipo || 'Sin interacciones'}</p>
                                <p className="text-xs">{client.ultimaInteraccionFecha ? format(new Date(client.ultimaInteraccionFecha), 'dd MMM yyyy', { locale: es }) : ''}</p>
                            </div>
                        </div>

                        {/* Acciones Rápidas */}
                        <div className="flex items-center justify-between border-t pt-2 mt-2">
                            <div className="flex items-center gap-1">
                                <WhatsAppButton telefono={client.telefono} />
                                {client.email && <EmailButton email={client.email} />}
                            </div>
                            <button onClick={() => setNotesOpen(true)} title="Ver/Editar Notas" className="p-1.5 rounded-md hover:bg-muted">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}