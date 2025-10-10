"use client";

import { useForm, SubmitHandler, useFieldArray, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';

// Tipos que coinciden con el modelo actualizado
type Campo = {
  titulo: string;
  tipo: 'texto' | 'textarea' | 'numero' | 'fecha' | 'checkbox' | 'seleccion' | 'combobox' | 'archivo';
  opciones?: string;
  requerido: boolean;
};

type FormInputs = {
  nombre: string;
  // ✅ El campo 'color' se elimina de la interfaz del formulario
  campos: Campo[];
};

// Etiquetas claras y descriptivas para los usuarios
const tiposDeCampo = [
  { value: 'texto', label: 'Texto Corto' },
  { value: 'textarea', label: 'Párrafo / Texto Largo' },
  { value: 'numero', label: 'Número' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'checkbox', label: 'Casilla Única (Sí/No)' },
  { value: 'seleccion', label: 'Lista Desplegable' },
  { value: 'combobox', label: 'Lista Desplegable con Buscador' },
  { value: 'archivo', label: 'Subir Archivo(s)' },
];

export function CreateStageDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, control, handleSubmit, reset, watch } = useForm<FormInputs>({
    defaultValues: {
      nombre: '',
      campos: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'campos',
  });

  const watchCampos = watch('campos');

  const mutation = useMutation({
    // El backend asignará el color, no necesitamos enviarlo
    mutationFn: (data: Omit<FormInputs, 'color'>) => axios.post('/api/create-stage', data),
    onSuccess: () => {
      toast.success("Etapa y formulario creados con éxito.");
      queryClient.invalidateQueries({ queryKey: ['etapasCotizacion'] });
      reset();
      setOpen(false);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Error al crear la etapa.";
      toast.error(errorMessage);
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    const processedData = {
      ...data,
      campos: data.campos.map(campo => ({
        ...campo,
        opciones: (campo.tipo === 'seleccion' || campo.tipo === 'combobox') && campo.opciones
          ? campo.opciones
          : undefined,
      })),
    };
    mutation.mutate(processedData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Crear Etapa</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Etapa de Cotización</DialogTitle>
          <DialogDescription>Define el nombre de la etapa y los campos del formulario que se requerirán al mover un lead aquí.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Datos de la Etapa</h3>
            <div className="grid grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la Etapa*</Label>
                <Input id="nombre" {...register('nombre', { required: true })} placeholder="Ej: Presupuesto Enviado" />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-semibold text-lg">Campos del Formulario (Opcional)</h3>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md relative bg-muted/30 space-y-4">
                  <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="space-y-2 md:col-span-5">
                      <Label>Título del Campo</Label>
                      <Input {...register(`campos.${index}.titulo`, { required: true })} placeholder="Ej: Fecha de visita a obra" />
                    </div>
                    <div className="space-y-2 md:col-span-4">
                      <Label>Tipo de Campo</Label>
                      <Controller
                        name={`campos.${index}.tipo`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {tiposDeCampo.map(tipo => (
                                <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex items-center space-x-2 md:col-span-3 pb-2">
                       <Controller
                          name={`campos.${index}.requerido`}
                          control={control}
                          render={({ field: controllerField }) => (
                              <Checkbox 
                                  id={`requerido-${index}`}
                                  checked={controllerField.value}
                                  onCheckedChange={controllerField.onChange}
                              />
                          )}
                      />
                      <Label htmlFor={`requerido-${index}`} className="whitespace-nowrap">Es obligatorio</Label>
                    </div>
                  </div>

                  {(watchCampos[index]?.tipo === 'seleccion' || watchCampos[index]?.tipo === 'combobox') && (
                    <div className="space-y-2">
                      <Label>Opciones (separadas por coma)</Label>
                      <Textarea {...register(`campos.${index}.opciones`)} placeholder="Ej: Opción 1, Opción 2, Opción 3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => append({ titulo: '', tipo: 'texto', requerido: false })}>
              <Plus className="h-4 w-4 mr-2" /> Agregar Campo al Formulario
            </Button>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar Etapa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}