"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { isToday, isPast, isThisWeek, parseISO } from 'date-fns';
import { Task } from '@/components/tareas/types';
import { TaskItem } from '@/components/tareas/TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Función para obtener las tareas
const getMyTasks = async (): Promise<Task[]> => {
  const { data } = await axios.get('/api/tareas');
  return data.data;
};

// Componente para renderizar una sección de tareas
const TaskSection = ({ title, tasks, emptyText }: { title: string, tasks: Task[], emptyText: string }) => {
  if (tasks.length === 0) return null; // No renderiza la sección si no hay tareas

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
            {tasks.map((task) => <TaskItem key={task._id} task={task} />)}
        </div>
      </CardContent>
    </Card>
  )
};


export default function MisTareasPage() {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'], // Usamos una clave genérica para poder invalidarla fácilmente
    queryFn: getMyTasks,
  });

  if (isLoading) {
    return <div className="p-10 text-center">Cargando tus tareas...</div>;
  }

  // Lógica para categorizar las tareas
  const now = new Date();
  const tasksNoCompletadas = tasks?.filter(t => !t.completada) || [];
  
  const vencidas = tasksNoCompletadas.filter(t => isPast(parseISO(t.fechaVencimiento)) && !isToday(parseISO(t.fechaVencimiento)));
  const paraHoy = tasksNoCompletadas.filter(t => isToday(parseISO(t.fechaVencimiento)));
  const estaSemana = tasksNoCompletadas.filter(t => isThisWeek(parseISO(t.fechaVencimiento), { weekStartsOn: 1 }) && !isToday(parseISO(t.fechaVencimiento)) && !isPast(parseISO(t.fechaVencimiento)));
  const proximamente = tasksNoCompletadas.filter(t => !isThisWeek(parseISO(t.fechaVencimiento), { weekStartsOn: 1 }) && !isToday(parseISO(t.fechaVencimiento)) && !isPast(parseISO(t.fechaVencimiento)));
  const completadas = tasks?.filter(t => t.completada) || [];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Mis Tareas</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-6">
          <TaskSection title="Vencidas 🥵" tasks={vencidas} emptyText="Ninguna tarea vencida." />
          <TaskSection title="Para Hoy 🔥" tasks={paraHoy} emptyText="Nada para hoy." />
        </div>
        <div className="space-y-6">
          <TaskSection title="Esta Semana 🗓️" tasks={estaSemana} emptyText="Semana libre." />
          <TaskSection title="Próximamente ✨" tasks={proximamente} emptyText="Ninguna tarea futura." />
        </div>
        <div className="space-y-6">
           <TaskSection title="Completadas ✅" tasks={completadas} emptyText="Aún no has completado tareas." />
        </div>
      </div>
    </div>
  );
}