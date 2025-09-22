"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieLabelRenderProps } from 'recharts';

interface ChartData {
    name: string;
    value: number;
    [key: string]: unknown;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export function RejectionReasonChart({ data }: { data: ChartData[] }) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Motivos de Rechazo</CardTitle></CardHeader>
                <CardContent className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">No hay datos de rechazo para mostrar.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader><CardTitle>Motivos de Rechazo</CardTitle></CardHeader>
            <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
  data={data}
  cx="50%"
  cy="50%"
  labelLine={false}
  outerRadius={100}
  fill="#8884d8"
  dataKey="value"
  nameKey="name"
  label={(props: PieLabelRenderProps) => {
  const name = props.name ?? 'Desconocido';
  const percent = Number(props.percent ?? 0); // <-- cast to number
  return `${name} ${(percent * 100).toFixed(0)}%`;
}}
>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} clientes`, 'Cantidad']} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}