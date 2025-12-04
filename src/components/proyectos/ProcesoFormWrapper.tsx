"use client";

import React, { useEffect } from "react";
import { useForm, UseFormReturn, DeepPartial } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { IProyecto } from "@/models/Proyecto"; // Ajusta la ruta
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProcesoFormWrapperProps<T extends object> {
  proyecto: IProyecto;
  etapaKey: keyof IProyecto; // ej: "visitaTecnica"
  tituloEtapa: string;
  validationSchema: ZodSchema<T>;
  children: (form: UseFormReturn<T>, esCompletado: boolean) => React.ReactNode;
}

// Campos comunes que pueden existir en las distintas etapas
interface EtapaBase {
  estado?: string;
  fechaCompletado?: string | Date;
}

// Payloads posibles para el PUT
type UpdateProyectoPayload =
  | {
      datosFormulario: {
        [key: string]: unknown;
      };
    }
  | {
      etapaACompletar: keyof IProyecto;
      datosFormulario: unknown;
    };

export function ProcesoFormWrapper<T extends object>({
  proyecto,
  etapaKey,
  tituloEtapa,
  validationSchema,
  children,
}: ProcesoFormWrapperProps<T>) {
  const queryClient = useQueryClient();

  // Datos actuales de esta etapa (tipados como T + campos comunes de etapa)
  const etapaData = proyecto[etapaKey] as (T & EtapaBase) | undefined;
  const esCompletado = etapaData?.estado === "Completado";
  const esEstadoActual = proyecto.estadoActual === tituloEtapa;

  // 1. Configurar React Hook Form
  const form = useForm<T>({
    resolver: zodResolver(validationSchema),
    defaultValues: (etapaData || {}) as DeepPartial<T>,
  });

  // 2. Sincronizar el formulario si los datos del proyecto cambian para esa etapa
  useEffect(() => {
    form.reset((etapaData || {}) as DeepPartial<T>);
  }, [etapaData, form]);

  // 3. Configurar la Mutación (API PUT)
  const mutation = useMutation<unknown, unknown, UpdateProyectoPayload>({
    mutationFn: (payload) =>
      axios.put(`/api/proyectos/${proyecto._id}`, payload),
    onSuccess: () => {
      // Refrescar los datos del proyecto en la caché
      queryClient.invalidateQueries({ queryKey: ["proyecto", proyecto._id] });
      // También refrescar la lista de proyectos por si cambió el estado
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      toast.success("¡Guardado con éxito!");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(
          "Error al guardar: " +
            (error.response?.data as { error?: string } | undefined)?.error ??
            error.message,
        );
      } else {
        toast.error(
          "Error al guardar: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    },
  });

  // 4. Handler para "Guardar Cambios" (sin avanzar etapa)
  const onSave = (values: T) => {
    const payload: UpdateProyectoPayload = {
      datosFormulario: {
        [etapaKey]: values, // Envía los datos anidados en su clave
      },
    };
    mutation.mutate(payload);
  };

  // 5. Handler para "Completar Etapa" (avanza el workflow)
  const onComplete = (values: T) => {
    const payload: UpdateProyectoPayload = {
      etapaACompletar: etapaKey,
      datosFormulario: values, // Envía los datos directamente
    };
    mutation.mutate(payload);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{tituloEtapa}</CardTitle>
          {esCompletado ? (
            <Badge className="bg-green-600">Completado</Badge>
          ) : esEstadoActual ? (
            <Badge className="bg-blue-500">En Progreso</Badge>
          ) : (
            <Badge variant="secondary">Pendiente</Badge>
          )}
        </div>
        {etapaData?.fechaCompletado && (
          <CardDescription>
            Completado el:{" "}
            {new Date(etapaData.fechaCompletado).toLocaleString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          {/* Usamos dos botones 'submit' dentro del <form>.
            Usamos el `handleSubmit` de RHF para decidir a qué función llamar.
          */}
          <form className="space-y-6">
            {/* Aquí se renderizan los campos específicos del formulario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {children(form, esCompletado)}
            </div>

            {/* Botones de Acción */}
            {!esCompletado && (
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(onSave)}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Guardar Cambios
                </Button>
                <Button
                  type="button"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={form.handleSubmit(onComplete)}
                  disabled={mutation.isPending || !esEstadoActual}
                  title={
                    !esEstadoActual
                      ? "Debe completar la etapa anterior primero"
                      : ""
                  }
                >
                  {mutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  ) : null}
                  Completar Etapa
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
