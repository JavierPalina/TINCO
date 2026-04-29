"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import {
  Users, TrendingUp, DollarSign, CheckCircle2, AlertCircle,
  Briefcase, Target, ArrowUpRight, Loader2, BarChart2, ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/context/CurrencyContext";

const PALETTE = ["#4fa588", "#70bfa3", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444"];

const ETAPA_COLORS: Record<string, string> = {
  Nuevo: "#6366f1",
  Contactado: "#3b82f6",
  Cotizado: "#f59e0b",
  "Negociación": "#8b5cf6",
  Ganado: "#22c55e",
  Perdido: "#ef4444",
};

type Metricas = {
  kpis: {
    totalClientes: number;
    clientesMes: number;
    tareasHoy: number;
    tareasVencidas: number;
    proyectosActivos: number;
    totalCotizado: number;
    totalGanado: number;
    totalCotizaciones: number;
    tasaConversion: number;
  };
  tendenciaMensual: { mes: string; total: number; cantidad: number }[];
  cotizacionesPorEtapa: { nombre: string; count: number; monto: number }[];
  clientesPorEtapa: { etapa: string; count: number }[];
  proyectosPorEstado: { estado: string; count: number }[];
  motivosRechazo: { name: string; value: number }[];
  topVendedores: { nombre: string; total: number; cantidad: number }[];
  clientesPorMes: { mes: string; count: number }[];
};

function KpiCard({
  title, value, sub, icon: Icon, accent = false, alert = false,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-destructive/40" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`mt-1 text-3xl font-bold tracking-tight ${alert ? "text-destructive" : accent ? "text-primary" : ""}`}>
              {value}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${alert ? "bg-destructive/10" : accent ? "bg-primary/10" : "bg-muted"}`}>
            <Icon className={`h-5 w-5 ${alert ? "text-destructive" : accent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MetricasPage() {
  const { formatMoney } = useCurrency();

  const { data, isLoading, isError } = useQuery<Metricas>({
    queryKey: ["metricas"],
    queryFn: async () => {
      const res = await axios.get<{ success: boolean; data: Metricas }>("/api/dashboard/metricas");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-muted-foreground">
        No se pudieron cargar las métricas.
      </div>
    );
  }

  const { kpis, tendenciaMensual, cotizacionesPorEtapa, clientesPorEtapa,
    proyectosPorEstado, motivosRechazo, topVendedores, clientesPorMes } = data;

  const maxVendedor = topVendedores[0]?.total ?? 1;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Métricas</h1>
        <p className="text-muted-foreground mt-1">Resumen completo del negocio en tiempo real</p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" /> Indicadores Clave
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard icon={DollarSign} title="Total Cotizado" value={formatMoney(kpis.totalCotizado)} sub="Monto total en pipeline" accent />
          <KpiCard icon={TrendingUp} title="Total Ganado" value={formatMoney(kpis.totalGanado)} sub={`${kpis.tasaConversion}% conversión`} accent />
          <KpiCard icon={Users} title="Clientes Totales" value={kpis.totalClientes} sub={`+${kpis.clientesMes} este mes`} />
          <KpiCard icon={Briefcase} title="Proyectos Activos" value={kpis.proyectosActivos} sub="En ejecución" />
          <KpiCard icon={ClipboardList} title="Cotizaciones" value={kpis.totalCotizaciones} sub="Generadas en total" />
          <KpiCard icon={Target} title="Conversión" value={`${kpis.tasaConversion}%`} sub="Ganado / Cotizado" accent />
          <KpiCard icon={CheckCircle2} title="Tareas Hoy" value={kpis.tareasHoy} sub="Pendientes para hoy" />
          <KpiCard icon={AlertCircle} title="Tareas Vencidas" value={kpis.tareasVencidas} sub="Requieren atención" alert={kpis.tareasVencidas > 0} />
        </div>
      </section>

      <Separator />

      {/* ── Tendencia mensual ─────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monto Cotizado por Mes</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tendenciaMensual}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatMoney(v)} width={80} />
                <Tooltip
                  formatter={(v: number) => [formatMoney(v), "Total"]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#4fa588" radius={[4, 4, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes Nuevos por Mes</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={clientesPorMes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line dataKey="count" stroke="#4fa588" strokeWidth={2} dot={{ fill: "#4fa588", r: 4 }} name="Clientes" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* ── Pipeline CRM + Cotizaciones por etapa ────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Clientes</CardTitle>
            <CardDescription>Clientes por etapa del embudo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {clientesPorEtapa.map(({ etapa, count }) => (
              <div key={etapa} className="flex items-center gap-3">
                <span className="w-28 text-sm text-muted-foreground truncate">{etapa}</span>
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${(count / (clientesPorEtapa[0]?.count || 1)) * 100}%`,
                      backgroundColor: ETAPA_COLORS[etapa] ?? "#4fa588",
                    }}
                  />
                </div>
                <Badge variant="secondary" className="text-xs min-w-[2.5rem] justify-center">{count}</Badge>
              </div>
            ))}
            {clientesPorEtapa.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cotizaciones por Etapa</CardTitle>
            <CardDescription>Cantidad y monto por etapa del pipeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {cotizacionesPorEtapa.slice(0, 8).map(({ nombre, count, monto }, i) => (
              <div key={nombre} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                <span className="flex-1 text-sm truncate">{nombre}</span>
                <span className="text-xs text-muted-foreground">{count} cot.</span>
                <Badge variant="outline" className="text-xs">{formatMoney(monto)}</Badge>
              </div>
            ))}
            {cotizacionesPorEtapa.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">Sin datos</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Top vendedores + Proyectos por estado ────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Vendedores</CardTitle>
            <CardDescription>Monto total cotizado por asesor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {topVendedores.map(({ nombre, total, cantidad }, i) => (
              <div key={nombre} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="text-muted-foreground text-xs w-4">{i + 1}.</span>
                    {nombre}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{cantidad} cot.</span>
                    <span className="font-semibold">{formatMoney(total)}</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${(total / maxVendedor) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topVendedores.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">Sin datos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proyectos por Estado</CardTitle>
            <CardDescription>Distribución del flujo de trabajo</CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            {proyectosPorEstado.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proyectosPorEstado}
                    dataKey="count"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    label={({ estado, count }) => `${estado}: ${count}`}
                    labelLine={false}
                  >
                    {proyectosPorEstado.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sin proyectos registrados
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Motivos de rechazo ────────────────────────────────── */}
      {motivosRechazo.length > 0 && (
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Motivos de Rechazo</CardTitle>
              <CardDescription>Por qué se pierden los clientes</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={motivosRechazo}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {motivosRechazo.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 py-2">
                {motivosRechazo.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                    <span className="flex-1 text-sm">{name}</span>
                    <Badge variant="secondary">{value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
