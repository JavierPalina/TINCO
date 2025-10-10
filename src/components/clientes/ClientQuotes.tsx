"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Quote {
    _id: string;
    codigo: string;
    montoTotal: number;
    estado: 'Borrador' | 'Enviada' | 'Aceptada' | 'Rechazada';
    createdAt: string;
}

const statusColors: Record<Quote['estado'], string> = {
    Borrador: 'bg-yellow-500',
    Enviada: 'bg-blue-500',
    Aceptada: 'bg-green-500',
    Rechazada: 'bg-red-500',
}

export function ClientQuotes({ clientId }: { clientId: string }) {
    const { data: quotes, isLoading } = useQuery<Quote[]>({
        queryKey: ['quotes', clientId],
        queryFn: async () => {
            const { data } = await axios.get(`/api/clientes/${clientId}/cotizaciones`);
            return data.data;
        },
        enabled: !!clientId,
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cotizaciones</CardTitle>
                <Button asChild>
                    <Link href={`/dashboard/cotizaciones/nueva?clienteId=${clientId}`}>
                        Crear Nueva
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading && <p>Cargando cotizaciones...</p>}
                <div className="space-y-4">
                    {quotes?.map((quote) => (
                        <div key={quote._id} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50">
                            <div>
                                <p className="font-semibold">{quote.codigo}</p>
                                <p className="text-sm text-muted-foreground">
                                    Monto: ${quote.montoTotal.toLocaleString('es-AR')}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Creada: {format(new Date(quote.createdAt), 'd MMM yyyy', { locale: es })}
                                </p>
                            </div>
                            <Badge className={statusColors[quote.estado]}>{quote.estado}</Badge>
                        </div>
                    ))}
                    {quotes?.length === 0 && !isLoading && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay cotizaciones para este cliente.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}