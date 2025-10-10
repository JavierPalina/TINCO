"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Task {
  _id: string;
  titulo: string;
  fechaVencimiento: string;
  completada: boolean;
}

interface NewTaskForm {
  titulo: string;
  fechaVencimiento: Date;
}

export function ClientTasks({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, control, reset } = useForm<NewTaskForm>();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/tareas?clientId=${clientId}`);
      return data.data;
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (newTask: NewTaskForm & { cliente: string }) => {
      return axios.post('/api/tareas', newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', clientId] });
      reset();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, completada }: { taskId: string; completada: boolean }) => {
      return axios.put(`/api/tareas/${taskId}`, { completada });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', clientId] });
    },
  });

  const onSubmit: SubmitHandler<NewTaskForm> = (data) => {
    addTaskMutation.mutate({ ...data, cliente: clientId });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tareas Pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2 mb-6">
          <Input {...register('titulo', { required: true })} placeholder="Nueva tarea..." className="flex-grow" />
          <Controller
            name="fechaVencimiento"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-[200px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Vencimiento</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
              </Popover>
            )}
          />
          <Button type="submit" size="icon" disabled={addTaskMutation.isPending}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-4">
          {isLoading && <p>Cargando tareas...</p>}
          {tasks?.map((task) => (
            <div key={task._id} className="flex items-center gap-4">
              <Checkbox
                id={task._id}
                checked={task.completada}
                onCheckedChange={(checked) => {
                  updateTaskMutation.mutate({ taskId: task._id, completada: !!checked });
                }}
              />
              <div className="flex-grow">
                <label htmlFor={task._id} className={cn("font-medium", task.completada && "line-through text-muted-foreground")}>
                  {task.titulo}
                </label>
                <p className={cn("text-xs", task.completada ? "text-muted-foreground" : "text-primary")}>
                  Vence: {format(new Date(task.fechaVencimiento), 'PPP', { locale: es })}
                </p>
              </div>
            </div>
          ))}
          {tasks?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay tareas para este cliente.</p>}
        </div>
      </CardContent>
    </Card>
  );
}