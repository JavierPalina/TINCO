"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { isPast, isToday, parseISO } from 'date-fns';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Task } from '@/components/tareas/types'; // Reutilizamos los tipos que ya creamos

// La misma función que usamos en la página de Tareas
const getMyTasks = async (): Promise<Task[]> => {
  const { data } = await axios.get('/api/tareas');
  return data.data;
};

export function NotificationBell() {
  // 1. Obtenemos las tareas en segundo plano.
  // TanStack Query es lo suficientemente inteligente como para usar el caché
  // si los datos ya fueron pedidos en la página de "Mis Tareas".
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: getMyTasks,
  });

  // 2. Filtramos para encontrar solo las tareas urgentes (no completadas y vencidas/para hoy)
  const urgentTasks = tasks?.filter(task => {
    if (task.completada) return false;
    const dueDate = parseISO(task.fechaVencimiento);
    return isToday(dueDate) || isPast(dueDate);
  }) || [];

  const urgentTasksCount = urgentTasks.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {/* 3. Mostramos el punto rojo solo si hay tareas urgentes */}
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
              urgentTasks.slice(0, 4).map(task => ( // Mostramos hasta 4 tareas
                <div key={task._id} className="text-sm">
                  <Link href={`/dashboard/clientes/${task.cliente?._id}`} className="font-semibold hover:underline">
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