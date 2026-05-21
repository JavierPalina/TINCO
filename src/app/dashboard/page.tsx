"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  ListChecks,
  Loader2,
  FileText,
  FolderKanban,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';
import { AddTaskDialog } from '@/components/tareas/AddTaskDialog';
import { TaskItem } from '@/components/tareas/TaskItem';
import { InitialSetupModal } from '@/components/dashboard/InitialSetupModal';
import type { Task } from '@/components/tareas/types';
import type { ActividadItem } from '@/app/api/dashboard/actividad-reciente/route';

interface TasksData {
  hoy: Task[];
  vencidas: Task[];
  proximas: Task[];
  completadas: Task[];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

const ACTIVITY_ICON: Record<ActividadItem["type"], React.ElementType> = {
  cotizacion: FileText,
  proyecto: FolderKanban,
  tarea: ClipboardCheck,
};

const ACTIVITY_BADGE_COLOR: Record<string, string> = {
  Completada: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  Alta: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Media: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Baja: "bg-muted text-muted-foreground",
};

export default function HomePage() {
  const { data: session } = useSession();
  const today = useMemo(() => new Date(), []);
  const todayKey = format(today, 'yyyy-MM-dd');

  const { data: tasksData, isLoading: tasksLoading } = useQuery<TasksData>({
    queryKey: ['tasks', todayKey],
    queryFn: async () => {
      const { data } = await axios.get('/api/tareas', { params: { date: todayKey } });
      return data.data;
    },
  });

  const { data: actividadData, isLoading: actividadLoading } = useQuery<{ data: ActividadItem[] }>({
    queryKey: ['actividad-reciente'],
    queryFn: () => axios.get('/api/dashboard/actividad-reciente').then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  const vencidasCount = tasksData?.vencidas.length ?? 0;
  const hoyCount = tasksData?.hoy.length ?? 0;
  const proximasCount = tasksData?.proximas.length ?? 0;

  const userName = session?.user?.name?.split(" ")[0] || "Usuario";
  const greeting = getGreeting();
  const dateLabel = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <InitialSetupModal />

      {/* Greeting header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground capitalize">{dateLabel}</p>
          <h1 className="text-3xl font-bold mt-0.5">
            {greeting}, {userName}
          </h1>
        </div>
        <AddTaskDialog />
      </div>

      {/* Overdue alert */}
      {vencidasCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Tenés <strong>{vencidasCount}</strong> tarea{vencidasCount !== 1 ? 's' : ''} vencida{vencidasCount !== 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

        {/* LEFT: Tasks */}
        <div>
          <Tabs defaultValue="hoy" className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold">Mis Tareas</h2>
              <TabsList className="h-8">
                <TabsTrigger value="hoy" className="text-xs px-2.5 py-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Hoy
                  {hoyCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 font-bold">{hoyCount}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="vencidas" className="text-xs px-2.5 py-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Vencidas
                  {vencidasCount > 0 && (
                    <span className="ml-1 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1.5 font-bold">{vencidasCount}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="proximas" className="text-xs px-2.5 py-1 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" />
                  Próximas
                  {proximasCount > 0 && (
                    <span className="ml-1 rounded-full bg-muted-foreground/20 text-[10px] px-1.5 font-bold">{proximasCount}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completadas" className="text-xs px-2.5 py-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Listas
                </TabsTrigger>
              </TabsList>
            </div>

            {tasksLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <TabsContent value="hoy" className="mt-0">
                  <Card>
                    <CardContent className="p-3 space-y-2">
                      {tasksData?.hoy.length ? (
                        tasksData.hoy.map((task) => <TaskItem key={task._id} task={task} />)
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <p className="text-sm font-medium">Sin tareas para hoy</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="vencidas" className="mt-0">
                  <Card>
                    <CardContent className="p-3 space-y-2">
                      {tasksData?.vencidas.length ? (
                        tasksData.vencidas.map((task) => <TaskItem key={task._id} task={task} />)
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <p className="text-sm font-medium">Sin tareas vencidas</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="proximas" className="mt-0">
                  <Card>
                    <CardContent className="p-3 space-y-2">
                      {tasksData?.proximas.length ? (
                        tasksData.proximas.map((task) => <TaskItem key={task._id} task={task} />)
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-10">No hay tareas próximas</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="completadas" className="mt-0">
                  <Card>
                    <CardContent className="p-3 space-y-2">
                      {tasksData?.completadas.length ? (
                        tasksData.completadas.map((task) => <TaskItem key={task._id} task={task} />)
                      ) : (
                        <p className="text-center text-sm text-muted-foreground py-10">No hay tareas completadas</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {/* RIGHT: Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Actividad reciente</h2>
          </div>
          <Card>
            <CardContent className="p-3">
              {actividadLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : !actividadData?.data.length ? (
                <p className="text-center text-sm text-muted-foreground py-10">Sin actividad reciente</p>
              ) : (
                <div className="space-y-1">
                  {actividadData.data.map((item) => {
                    const Icon = ACTIVITY_ICON[item.type];
                    const badgeClass = ACTIVITY_BADGE_COLOR[item.badge] ?? "bg-muted text-muted-foreground";
                    return (
                      <Link
                        key={`${item.type}-${item.id}`}
                        href={item.href}
                        className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{item.titulo}</p>
                          {item.subtitulo && (
                            <p className="text-xs text-muted-foreground truncate">{item.subtitulo}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badgeClass}`}>
                              {item.badge}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(item.fecha), { locale: es, addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
