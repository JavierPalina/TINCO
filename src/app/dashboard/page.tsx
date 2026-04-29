"use client";

import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle, Clock, ListChecks } from 'lucide-react';
import { AddTaskDialog } from '@/components/tareas/AddTaskDialog';
import { TasksTimeline } from '@/components/tareas/TasksTimeline';
import { TaskItem } from '@/components/tareas/TaskItem';
import { InitialSetupModal } from '@/components/dashboard/InitialSetupModal';
import { Card, CardContent } from '@/components/ui/card';
import { Task } from '@/components/tareas/types';

interface TasksData {
  hoy: Task[];
  vencidas: Task[];
  proximas: Task[];
  completadas: Task[];
}

export default function HomePage() {
  const [date, setDate] = useState<Date>(new Date());

  const { data, isLoading } = useQuery<TasksData>({
    queryKey: ['tasks', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data } = await axios.get('/api/tareas', { params: { date: format(date, 'yyyy-MM-dd') } });
      return data.data;
    },
  });

  const vencidasCount = data?.vencidas.length ?? 0;
  const hoyCount = data?.hoy.length ?? 0;
  const proximasCount = data?.proximas.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <InitialSetupModal />
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 p-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Tareas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {format(date, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[220px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, "d MMM yyyy", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus />
            </PopoverContent>
          </Popover>
          <AddTaskDialog />
        </div>
      </div>

      {vencidasCount > 0 && (
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Tenés <strong>{vencidasCount}</strong> tarea{vencidasCount !== 1 ? 's' : ''} vencida{vencidasCount !== 1 ? 's' : ''}.</span>
        </div>
      )}

      <Tabs defaultValue="hoy" className="w-full p-4 pt-0 flex-1">
        <TabsList className="mb-4">
          <TabsTrigger value="hoy" className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Hoy
            {hoyCount > 0 && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 font-bold">{hoyCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vencidas" className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            Vencidas
            {vencidasCount > 0 && (
              <span className="ml-1 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 font-bold">{vencidasCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="proximas" className="flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" />
            Próximas
            {proximasCount > 0 && (
              <span className="ml-1 rounded-full bg-muted-foreground/20 text-[10px] px-1.5 py-0.5 font-bold">{proximasCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completadas" className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completadas
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex justify-center items-center p-20">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="hoy">
              <TasksTimeline tasks={data?.hoy || []} />
            </TabsContent>
            <TabsContent value="vencidas">
              <Card>
                <CardContent className="p-4 space-y-2">
                  {data?.vencidas.length ? (
                    data.vencidas.map((task) => <TaskItem key={task._id} task={task} />)
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                      <CheckCircle2 className="h-10 w-10 text-green-500" />
                      <p className="font-medium">¡Sin tareas vencidas!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="proximas">
              <Card>
                <CardContent className="p-4 space-y-2">
                  {data?.proximas.length ? (
                    data.proximas.map((task) => <TaskItem key={task._id} task={task} />)
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay tareas próximas</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="completadas">
              <Card>
                <CardContent className="p-4 space-y-2">
                  {data?.completadas.length ? (
                    data.completadas.map((task) => <TaskItem key={task._id} task={task} />)
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hay tareas completadas</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
