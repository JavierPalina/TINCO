"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Task } from './types';
import { toast } from 'sonner';

export function TaskItem({ task }: { task: Task }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, completada }: { taskId: string; completada: boolean }) =>
      axios.put(`/api/tareas/${taskId}`, { completada }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.completada ? "Tarea marcada como completada ✅" : "Tarea marcada como pendiente 🔄"
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: () => toast.error("Error al actualizar la tarea ❌"),
  });

  return (
    <div
  className={cn(
    "flex items-center justify-between p-4 rounded-xl border shadow-sm transition hover:shadow-md",
    task.prioridad === "Alta" && "bg-muted",
    task.prioridad === "Media" && "bg-muted-foreground",
    task.prioridad === "Baja" && "bg-background"
  )}
>
  <div className="flex items-start gap-3 flex-1">
    <Checkbox
      id={task._id}
      checked={task.completada}
      onCheckedChange={(checked) =>
        updateTaskMutation.mutate({ taskId: task._id, completada: !!checked })
      }
    />
    <div>
      <label
        htmlFor={task._id}
        className={cn(
          "font-semibold text-base cursor-pointer",
          task.completada && "line-through text-muted-foreground"
        )}
      >
        {task.titulo}
      </label>
      {task.cliente && (
        <p className="text-sm text-muted-foreground">
          Cliente:{" "}
          <Link
            href={`/dashboard/clientes/${task.cliente._id}`}
            className="hover:underline text-primary"
          >
            {task.cliente.nombreCompleto}
          </Link>
        </p>
      )}
      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        Prioridad: {task.prioridad}
      </span>
    </div>
  </div>
  <span className="text-sm font-bold text-primary">
    {format(new Date(task.fechaVencimiento), "d MMM", { locale: es })}
  </span>
</div>
  );
}