"use client";

import React, { useEffect, useMemo } from "react";
import {
  useForm,
  type UseFormReturn,
  type DefaultValues,
  type Resolver,
  type FieldValues,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { IProyecto } from "@/models/Proyecto";
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

// Campos comunes que pueden existir en las distintas etapas
interface EtapaBase {
  estado?: string;
  fechaCompletado?: string | Date;
}

// Payloads posibles para el PUT
type UpdateProyectoPayload =
  | {
      datosFormulario: Record<string, unknown>;
    }
  | {
      etapaACompletar: keyof IProyecto;
      datosFormulario: unknown;
    };

interface ProcesoFormWrapperProps<T extends FieldValues> {
  proyecto: IProyecto;
  etapaKey: keyof IProyecto; // ej: "visitaTecnica" | "medicion" | "verificacion" | "logistica"
  tituloEtapa: string;

  // 👇 IMPORTANTE: este tipo permite que T venga desde afuera
  validationSchema: z.ZodType<T, any, any>;

  children: (form: UseFormReturn<T>, esCompletado: boolean) => React.ReactNode;
}

export function ProcesoFormWrapper<T extends FieldValues>({
  proyecto,
  etapaKey,
  tituloEtapa,
  validationSchema,
  children,
}: ProcesoFormWrapperProps<T>) {
  const queryClient = useQueryClient();

  // Datos actuales de esta etapa (tipados como T + campos comunes de etapa)
  const etapaData = proyecto[etapaKey] as (Partial<T> & EtapaBase) | undefined;

  const esCompletado = etapaData?.estado === "Completado";
  const esEstadoActual = proyecto.estadoActual === tituloEtapa;

  // ✅ Default values correctos para RHF moderno
  const defaultValues = useMemo<DefaultValues<T>>(
    () => ((etapaData || {}) as DefaultValues<T>),
    [etapaData],
  );

  // ✅ Resolver tipado sin pelearse con Zod/RHF
  const resolver = useMemo(
    () => zodResolver(validationSchema) as unknown as Resolver<T>,
    [validationSchema],
  );

  // 1) Configurar React Hook Form
  const form = useForm<T>({
    resolver,
    defaultValues,
  });

  // 2) Sincronizar el formulario si los datos del proyecto cambian
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  // 3) Mutación PUT
  const mutation = useMutation<unknown, unknown, UpdateProyectoPayload>({
    mutationFn: (payload) =>
      axios.put(`/api/proyectos/${proyecto._id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proyecto", proyecto._id] });
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      queryClient.invalidateQueries({
        queryKey: ["proyectos-visita-tecnica"],
      });

      toast.success("¡Guardado con éxito!");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const apiError =
          (error.response?.data as { error?: string } | undefined)?.error ??
          error.message;
        toast.error("Error al guardar: " + apiError);
      } else {
        toast.error(
          "Error al guardar: " +
            (error instanceof Error ? error.message : "Error desconocido"),
        );
      }
    },
  });

  // 4) Guardar sin avanzar etapa
  const onSave: SubmitHandler<T> = (values) => {
    const payload: UpdateProyectoPayload = {
      datosFormulario: {
        [etapaKey]: values,
      },
    };
    mutation.mutate(payload);
  };

  // 5) Completar etapa (avanza workflow)
  const onComplete: SubmitHandler<T> = (values) => {
    const payload: UpdateProyectoPayload = {
      etapaACompletar: etapaKey,
      datosFormulario: values,
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
          <form className="space-y-6">
            {/* Campos del formulario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {children(form, esCompletado)}
            </div>

            {/* Botones */}
            {!esCompletado && (
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={form.handleSubmit(onSave)}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
