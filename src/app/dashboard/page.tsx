"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ArrowUp, Crown, Package, Building2, User, BarChart2, TrendingUp, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { 
    Bar, 
    BarChart, 
    ResponsiveContainer, 
    Tooltip, 
    XAxis, 
    YAxis, 
    Legend, 
    Line,
    ComposedChart,
    PieChart,
    Pie,
    Cell
} from 'recharts';

// --- PALETA DE COLORES PERSONALIZADA ---
const COLORS = {
    primary: '#4fa588', // Verde Turquesa principal
    light: '#e6f4f0',   // Verde muy pálido para fondos o resaltados
    medium: '#70bfa3',  // Tono medio
    dark: '#3e846b',    // Tono oscuro para texto o elementos clave
    textPrimary: '#2d3748', // Un gris oscuro casi negro para texto principal
    textSecondary: '#718096', // Un gris medio para texto secundario
    // Colores para gráficos que necesitan múltiples tonos.
    chart1: '#4fa588', // Principal
    chart2: '#70bfa3', // Medio
    chart3: '#a3d9c7', // Variante más clara
    chart4: '#3e846b', // Oscuro
    // Colores para el gráfico de torta
    pieChartColors: ['#4fa588', '#70bfa3', '#a3d9c7', '#3e846b']
};

// --- DATOS FICTICIOS EN ESPAÑOL (sin cambios) ---
const mockData = {
    ventaTotalAnual: 12584350,
    sucursalPrincipal: { nombre: "Sucursal Centro", ventaAnual: 4850200 },
    vendedorEstrella: { nombre: "Ana García", ventaAnual: 2150000, avatar: "/avatars/02.png" },
    productoMasVendido: { nombre: "Producto X Pro", unidades: 1240 },
    
    ventasMensualesSucursal: [
        { mes: "Ene", Centro: 400, Norte: 240, Sur: 180 },
        { mes: "Feb", Centro: 300, Norte: 139, Sur: 220 },
        { mes: "Mar", Centro: 500, Norte: 480, Sur: 250 },
        { mes: "Abr", Centro: 478, Norte: 390, Sur: 310 },
        { mes: "May", Centro: 590, Norte: 480, Sur: 290 },
        { mes: "Jun", Centro: 490, Norte: 380, Sur: 410 },
    ],

    ventasMensualesUsuario: [
        { mes: "Ene", "Ana García": 210, "Carlos Ruiz": 150, "Laura Paz": 110 },
        { mes: "Feb", "Ana García": 240, "Carlos Ruiz": 180, "Laura Paz": 130 },
        { mes: "Mar", "Ana García": 290, "Carlos Ruiz": 200, "Laura Paz": 150 },
        { mes: "Abr", "Ana García": 270, "Carlos Ruiz": 220, "Laura Paz": 160 },
        { mes: "May", "Ana García": 310, "Carlos Ruiz": 210, "Laura Paz": 180 },
        { mes: "Jun", "Ana García": 280, "Carlos Ruiz": 230, "Laura Paz": 190 },
    ],

    rankingUsuarios: [
        { id: 1, nombre: "Ana García", ventas: 2150000, avatar: "/avatars/02.png" },
        { id: 2, nombre: "Carlos Ruiz", ventas: 1890000, avatar: "/avatars/01.png" },
        { id: 3, nombre: "Laura Paz", ventas: 1650000, avatar: "/avatars/03.png" },
        { id: 4, nombre: "Marcos Díaz", ventas: 1320000, avatar: "/avatars/04.png" },
    ],

    ventasPorProducto: [
        { name: 'Producto X Pro', value: 400 },
        { name: 'Componente Z', value: 300 },
        { name: 'Kit Inicial Y', value: 300 },
        { name: 'Accesorio W', value: 200 },
    ],
};

// --- COMPONENTES DEL DASHBOARD MODERNO ---

// Tarjeta de estadística moderna (ajustada a la paleta)
function StatCardModerno({ icon: Icon, title, value, footer }: { icon: React.ElementType, title: string, value: string, footer: string }) {
    return (
        <Card className="shadow-lg border-0 
                        bg-gradient-to-br from-white to-gray-50 
                        dark:from-slate-800 dark:to-slate-900 
                        text-zinc-900 dark:text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" style={{ color: COLORS.medium }} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground pt-1">{footer}</p>
            </CardContent>
        </Card>
    );
}

// Gráfico principal de ventas mensuales (cambia entre sucursal y usuario) - Ajustado a la paleta
function GraficoVentasMensuales() {
    const [vista, setVista] = useState<'sucursal' | 'usuario'>('sucursal');
    const datos = vista === 'sucursal' ? mockData.ventasMensualesSucursal : mockData.ventasMensualesUsuario;
    const keys = Object.keys(datos[0]).filter(k => k !== 'mes');
    const colors = [COLORS.chart1, COLORS.chart2, COLORS.chart3, COLORS.chart4]; // Usamos los colores de la paleta

    return (
        <Card className="col-span-1 lg:col-span-4 shadow-xl border-0 bg-white dark:bg-slate-800">
            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle className="text-slate-800 dark:text-slate-100">Ventas Mensuales</CardTitle>
                    <ToggleGroup 
                        type="single" 
                        value={vista} 
                        onValueChange={(value: 'sucursal' | 'usuario') => value && setVista(value)} 
                        className="mt-2 sm:mt-0 bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5"
                    >
                        <ToggleGroupItem 
                            value="sucursal" 
                            aria-label="Por Sucursal" 
                            className="data-[state=on]:bg-gradient-to-r data-[state=on]:from-[#4fa588] data-[state=on]:to-[#4fa588] data-[state=on]:text-white rounded-md px-3 py-1 text-sm font-medium"
                        >
                            Por Sucursal
                        </ToggleGroupItem>
                        <ToggleGroupItem 
                            value="usuario" 
                            aria-label="Por Usuario" 
                            className="data-[state=on]:bg-gradient-to-r data-[state=on]:from-[#4fa588] data-[state=on]:to-[#4fa588] data-[state=on]:text-white rounded-md px-3 py-1 text-sm font-medium"
                        >
                            Por Usuario
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>
            <CardContent className="h-[400px] w-full p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={datos}>
                        <XAxis dataKey="mes" stroke={COLORS.textSecondary} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={COLORS.textSecondary} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(Number(value) * 1000).toLocaleString('es-AR')}`} />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.1)' }}
                            contentStyle={{ backgroundColor: 'rgba(20, 20, 30, 0.8)', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        {keys.map((key, index) => (
                            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} name={key} barSize={20} radius={[4, 4, 0, 0]} />
                        ))}
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// Ranking de Ventas (ajustado a la paleta)
function RankingList({ title, data, icon: Icon }: { title: string, data: { nombre: string, ventas: number, avatar: string }[], icon: React.ElementType }) {
    const maxVentas = Math.max(...data.map(item => item.ventas));
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-xl border-0 bg-white dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center">
                <Icon className="h-5 w-5 mr-2" style={{ color: COLORS.primary }} />
                <CardTitle className="text-slate-800 dark:text-slate-100">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {data.map((item, index) => (
                        <li key={item.nombre} className="flex items-center gap-4">
                            <span className="text-lg font-bold text-muted-foreground" style={{ color: COLORS.medium }}>{index + 1}</span>
                            <Avatar>
                                <AvatarImage src={item.avatar} />
                                <AvatarFallback>{item.nombre.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <p className="font-medium text-slate-800 dark:text-slate-100">{item.nombre}</p>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1">
                                    <div 
                                        className="h-2 rounded-full" 
                                        style={{ width: `${(item.ventas / maxVentas) * 100}%`, backgroundColor: COLORS.primary }}>
                                    </div>
                                </div>
                            </div>
                            <span className="font-semibold text-right text-slate-800 dark:text-slate-100">${item.ventas.toLocaleString('es-AR')}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

// Gráfico de torta para ventas por producto (ajustado a la paleta)
function GraficoVentasProducto({ data }: { data: typeof mockData.ventasPorProducto }) {
    return (
        <Card className="col-span-1 lg:col-span-2 shadow-xl border-0 bg-white dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center">
                <Package className="h-5 w-5 mr-2" style={{ color: COLORS.primary }} />
                <CardTitle className="text-slate-800 dark:text-slate-100">Ventas por Producto</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            innerRadius={60}
                            fill={COLORS.primary} // Color principal si solo hay una porción
                            dataKey="value"
                            paddingAngle={5}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.pieChartColors[index % COLORS.pieChartColors.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(20, 20, 30, 0.8)', border: 'none', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

// --- PÁGINA PRINCIPAL DEL DASHBOARD ---

export default function DashboardPage() {
    const stats = mockData;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-100">Panel de Control</h1>
                
                {/* Tarjetas de estadísticas principales */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatCardModerno 
                        icon={DollarSign}
                        title="Venta Total (Anual)"
                        value={`$${(stats.ventaTotalAnual / 1000000).toFixed(2)}M`}
                        footer="Actualizado al día de hoy"
                    />
                     <StatCardModerno 
                        icon={Building2}
                        title="Sucursal Principal"
                        value={stats.sucursalPrincipal.nombre}
                        footer={`$${(stats.sucursalPrincipal.ventaAnual / 1000000).toFixed(2)}M en ventas`}
                    />
                     <StatCardModerno 
                        icon={Crown}
                        title="Vendedor Estrella"
                        value={stats.vendedorEstrella.nombre}
                        footer={`$${(stats.vendedorEstrella.ventaAnual / 1000000).toFixed(2)}M en ventas`}
                    />
                     <StatCardModerno 
                        icon={Package}
                        title="Producto Más Vendido"
                        value={stats.productoMasVendido.nombre}
                        footer={`${stats.productoMasVendido.unidades} unidades vendidas`}
                    />
                </div>

                {/* Gráficos y Rankings */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Gráfico principal */}
                    <GraficoVentasMensuales />
                    
                    {/* Rankings y gráfico de torta */}
                    <RankingList 
                        title="Ranking de Vendedores" 
                        data={stats.rankingUsuarios}
                        icon={TrendingUp}
                    />
                    <GraficoVentasProducto data={stats.ventasPorProducto} />
                </div>
            </div>
        </div>
    );
}