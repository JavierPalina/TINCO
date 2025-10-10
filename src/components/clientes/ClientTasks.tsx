"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ITask {
  _id: string;
  titulo: string;
  completada: boolean;
  fechaVencimiento: string;
}

export function ClientTasks({ clientId }: { clientId: string }) {
  const { data: tasks, isLoading, error } = useQuery<ITask[]>({
    queryKey: ['tasks', clientId],
    queryFn: async () => {
      // ✅ 1. SOLUCIÓN APLICADA: Accedemos a .data.data
      const response = await axios.get(`/api/clientes/${clientId}/tareas`);
      // Si no hay tareas, devolvemos un array vacío para evitar errores.
      return response.data.data || []; 
    },
    enabled: !!clientId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-6 w-6" />
          <span>Tareas Pendientes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading && <p>Cargando tareas...</p>}
          {error && <p className="text-red-500">No se pudieron cargar las tareas.</p>}
          
          {/* ✅ 2. CAPA DE SEGURIDAD APLICADA */}
          {Array.isArray(tasks) && tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task._id} className="flex items-start gap-4">
                <Checkbox
                  id={task._id}
                  checked={task.completada}
                  className="mt-1"
                  // onCheckedChange={(checked) => handleUpdateTask(task._id, checked)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={task._id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {task.titulo}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Vence: {format(new Date(task.fechaVencimiento), "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            !isLoading && <p className="text-sm text-muted-foreground">No hay tareas pendientes para este cliente.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}