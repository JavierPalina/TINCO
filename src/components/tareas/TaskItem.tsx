"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Task } from './types';

export function TaskItem({ task }: { task: Task }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, completada }: { taskId: string; completada: boolean }) => {
      return axios.put(`/api/tareas/${taskId}`, { completada });
    },
    // Al tener éxito, invalidamos la query principal de tareas para que toda la página se refresque
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <div className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
      <Checkbox
        id={task._id}
        checked={task.completada}
        onCheckedChange={(checked) => {
          updateTaskMutation.mutate({ taskId: task._id, completada: !!checked });
        }}
        aria-label="Marcar tarea como completada"
      />
      <div className="flex-grow">
        <label
          htmlFor={task._id}
          className={cn(
            "font-medium cursor-pointer",
            task.completada && "line-through text-muted-foreground"
          )}
        >
          {task.titulo}
        </label>
        {task.cliente && (
          <p className="text-xs text-muted-foreground">
            Cliente:{" "}
            <Link href={`/dashboard/clientes/${task.cliente._id}`} className="hover:underline text-primary">
              {task.cliente.nombreCompleto}
            </Link>
          </p>
        )}
      </div>
      <div className={cn(
        "text-sm font-semibold",
        task.completada ? "text-muted-foreground" : "text-primary"
      )}>
        {format(new Date(task.fechaVencimiento), 'd MMM', { locale: es })}
      </div>
    </div>
  );
}