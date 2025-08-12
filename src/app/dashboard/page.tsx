"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Users, ClipboardCheck, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { RejectionReasonChart } from '@/components/dashboard/RejectionReasonChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
    tareasHoy: number;
    nuevosClientesMes: number;
    totalCotizado: number;
    totalGanado: number;
    motivosRechazo: { name: string; value: number }[];
}

const getDashboardStats = async (): Promise<DashboardStats> => {
    const { data } = await axios.get('/api/dashboard/stats');
    return data.data;
}

export default function DashboardPage() {
    const { data: stats, isLoading } = useQuery<DashboardStats>({
        queryKey: ['dashboardStats'],
        queryFn: getDashboardStats,
    });

    if (isLoading) {
        return <div className="p-10 text-center">Cargando dashboard...</div>;
    }

    if (!stats) {
        return <div className="p-10 text-center text-red-500">No se pudieron cargar las estadísticas.</div>
    }

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            
            {/* Sección de Tarjetas de Estadísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatCard 
                    title="Nuevos Clientes (Mes)" 
                    value={stats.nuevosClientesMes} 
                    icon={Users} 
                />
                <StatCard 
                    title="Tareas para Hoy" 
                    value={stats.tareasHoy} 
                    icon={ClipboardCheck} 
                />
                <StatCard 
                    title="Total Cotizado" 
                    value={`$${stats.totalCotizado.toLocaleString('es-AR')}`} 
                    icon={DollarSign} 
                />
                <StatCard 
                    title="Total Ganado" 
                    value={`$${stats.totalGanado.toLocaleString('es-AR')}`} 
                    icon={DollarSign} 
                />
            </div>

            {/* Sección de Gráficos */}
            <div className="grid gap-8 md:grid-cols-2">
                <RejectionReasonChart data={stats.motivosRechazo} />
                {/* Aquí podrías añadir otro gráfico en el futuro, por ejemplo, de Cotizado vs Ganado */}
                 <Card>
                    <CardHeader><CardTitle>Rendimiento (Próximamente)</CardTitle></CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                         <p className="text-muted-foreground">Más gráficos y reportes aquí.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}