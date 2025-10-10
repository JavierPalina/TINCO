"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { Task } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
}

const timeToPercentage = (time?: string, startHour = 8, totalHours = 12) => {
  if (!time) return 0;
  const [hour, minute] = time.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return 0;
  const totalMinutes = (hour - startHour) * 60 + minute;
  return (totalMinutes / (totalHours * 60)) * 100;
};

export function TasksTimeline({ tasks }: Props) {
  const startHour = 0;
  const endHour = 24;
  const totalHours = endHour - startHour;
  const hours = Array.from({ length: totalHours }, (_, i) => i + startHour);

  const prioridadStyles = {
    Alta: "bg-red-500",
    Media: "bg-yellow-500",
    Baja: "bg-blue-500",
  };

  return (
    <Card className="h-[80vh] flex flex-col shadow-md">
  <CardContent className="p-4 overflow-x-auto flex-1">
    {tasks.length === 0 ? (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No hay tareas para mostrar en la línea de tiempo 📅
      </div>
    ) : (
      <div className="flex min-w-[1000px] h-full">
        <div className="w-56 pr-4 border-r bg-muted/20 sticky left-0 z-10">
          <div className="h-12 text-sm font-semibold flex items-center">Asignados</div>
          {tasks.map((task) => (
            <div key={task._id} className="h-12 flex items-center truncate text-sm">
              {task.cliente?._id ? (
                <Link
                  href={`/dashboard/clientes/${task.cliente._id}`}
                  className="hover:underline font-medium"
                >
                  {task.titulo}
                </Link>
              ) : (
                <span className="font-medium">{task.titulo}</span>
              )}
            </div>
          ))}
        </div>

        {/* Línea de tiempo */}
        <div className="flex-1 relative">
          {/* Encabezado de horas */}
          <div
            className="grid h-12 bg-muted/10"
            style={{ gridTemplateColumns: `repeat(${totalHours}, 1fr)` }}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="text-center text-sm font-semibold border-l flex items-center justify-center text-muted-foreground"
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Contenido */}
          <div className="relative">
            {tasks.map((task, index) => {
              const left = timeToPercentage(task.horaInicio, startHour, totalHours);
              const right = timeToPercentage(task.horaFin, startHour, totalHours);
              const width = right - left;

              return (
                <TooltipProvider key={task._id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="absolute h-10 flex items-center px-3 rounded-lg text-white cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md"
                        style={{
                          top: `${index * 48 + 4}px`,
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor:
                            task.prioridad === "Alta"
                              ? "#ef4444"
                              : task.prioridad === "Media"
                              ? "#eab308"
                              : "#3b82f6",
                        }}
                      >
                        <span className="truncate text-xs font-semibold">
                          {task.cliente?.nombreCompleto || "Tarea General"}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1 text-sm">
                        <p className="font-bold">{task.titulo}</p>
                        {task.descripcion && (
                          <p className="">{task.descripcion}</p>
                        )}
                        <p className="text-xs">
                          Cliente:{" "}
                          <span className="font-medium">
                            {task.cliente?.nombreCompleto || "N/A"}
                          </span>
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
            <div
              className="absolute inset-0 grid -z-10"
              style={{ gridTemplateColumns: `repeat(${totalHours}, 1fr)` }}
            >
              {hours.map((hour) => (
                <div key={hour} className="border-l border-muted h-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
  </CardContent>
</Card>
  );
}