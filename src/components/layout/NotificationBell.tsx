"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Task } from '@/components/tareas/types';

interface TasksData {
  hoy: Task[];
  vencidas: Task[];
  proximas: Task[];
  completadas: Task[];
}

const getMyTasks = async (): Promise<TasksData> => {
  const { data } = await axios.get('/api/tareas');
  return data.data;
};

export function NotificationBell() {
  const { data: tasksData } = useQuery<TasksData>({
    queryKey: ['tasks'],
    queryFn: getMyTasks,
  });

  const urgentTasks = [
    ...(tasksData?.vencidas || []),
    ...(tasksData?.hoy || []),
  ];

  const urgentTasksCount = urgentTasks.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {urgentTasksCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notificaciones</h4>
            <p className="text-sm text-muted-foreground">
              Tienes {urgentTasksCount} tarea{urgentTasksCount !== 1 ? 's' : ''} urgente{urgentTasksCount !== 1 ? 's' : ''}.
            </p>
          </div>
          <div className="grid gap-2">
            {urgentTasks.length > 0 ? (
              urgentTasks.slice(0, 4).map(task => (
                <div key={task._id} className="text-sm">
                  <Link href={`/dashboard/listados/${task.cliente?._id}`} className="font-semibold hover:underline">
                    {task.titulo}
                  </Link>
                  <p className="text-muted-foreground">
                    Cliente: {task.cliente?.nombreCompleto || 'N/A'}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-muted-foreground py-4">No hay notificaciones.</p>
            )}
            <Button variant="ghost" asChild className="mt-2">
                <Link href="/dashboard/tareas">Ver todas las tareas</Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}