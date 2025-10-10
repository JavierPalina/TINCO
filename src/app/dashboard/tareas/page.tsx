"use client";

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DateRange } from "react-day-picker";

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { AddTaskDialog } from '@/components/tareas/AddTaskDialog';
import { TasksTimeline } from '@/components/tareas/TasksTimeline';
import { TaskItem } from '@/components/tareas/TaskItem';
import { ITarea } from '@/models/Tarea';
import { Card, CardContent } from '@/components/ui/card';
import { Task } from '@/components/tareas/types';

interface TasksData {
  hoy: Task[];
  vencidas: Task[];
  proximas: Task[];
  completadas: Task[];
}

export default function MisTareasPage() {
  const [date, setDate] = useState<Date>(new Date());

  const { data, isLoading } = useQuery<TasksData>({
    queryKey: ['tasks', format(date, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data } = await axios.get('/api/tareas', { params: { date: format(date, 'yyyy-MM-dd') } });
      return data.data;
    },
  });

  return (
    <div className="h-screen mx-auto flex flex-col">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 p-4 border-b">
        <h1 className="text-3xl font-bold">Mis Tareas</h1>
        <div className="flex items-center gap-2 ">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(d) => setDate(d || new Date())} initialFocus />
            </PopoverContent>
          </Popover>
          <AddTaskDialog />
        </div>
      </div>
      
      <Tabs defaultValue="hoy" className="w-full p-4 pt-0">
        <TabsList>
          <TabsTrigger value="hoy">Hoy ({data?.hoy.length || 0})</TabsTrigger>
          <TabsTrigger value="vencidas">Vencidas ({data?.vencidas.length || 0})</TabsTrigger>
          <TabsTrigger value="proximas">Próximas ({data?.proximas.length || 0})</TabsTrigger>
          <TabsTrigger value="completadas">Completadas</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
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
                    <p className="text-center text-muted-foreground py-6">No hay tareas vencidas</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="proximas">
              <Card><CardContent className="p-4 space-y-2">
                {data?.proximas.length ? (
                    data.proximas.map((task) => <TaskItem key={task._id} task={task} />)
                ) : (
                  <p className="text-center text-muted-foreground py-6">No hay tareas proximas</p>
                )}
                </CardContent></Card>
            </TabsContent>
            <TabsContent value="completadas">
              <Card><CardContent className="p-4 space-y-2">
                {data?.completadas.length ? (
                    data.completadas.map((task) => <TaskItem key={task._id} task={task} />)
                ) : (
                  <p className="text-center text-muted-foreground py-6">No hay tareas completadas</p>
                )}
                </CardContent></Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}