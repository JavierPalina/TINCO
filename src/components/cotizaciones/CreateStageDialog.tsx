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
  opciones?: string | string[];
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
        opciones:
          (campo.tipo === 'seleccion' || campo.tipo === 'combobox') && typeof campo.opciones === 'string'
            ? campo.opciones
                .split(',')
                .map(opt => opt.trim()) // limpia espacios
                .filter(opt => opt.length > 0) // evita vacíos
            : undefined,
      })),
    };
  
    mutation.mutate(processedData as FormInputs);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Crear Etapa</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
  <DialogHeader>
    <DialogTitle>Crear Nueva Etapa de Cotización</DialogTitle>
    <DialogDescription>
      Define el nombre de la etapa y los campos del formulario que se requerirán al mover un lead aquí.
    </DialogDescription>
  </DialogHeader>

  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
    <div className="p-4 border rounded-lg mb-4">
      <h3 className="font-semibold text-lg mb-2">Datos de la Etapa</h3>
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre de la Etapa*</Label>
        <Input id="nombre" {...register('nombre', { required: true })} placeholder="Ej: Presupuesto Enviado" />
      </div>
    </div>

    <div className="p-4 border rounded-lg flex flex-col flex-1 overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Campos del Formulario (Opcional)</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ titulo: '', tipo: 'texto', requerido: false })}
        >
          <Plus className="h-4 w-4 mr-1" /> Agregar Campo
        </Button>
      </div>

      {/* Tabla scrollable */}
      <div className="overflow-y-auto border rounded-md max-h-[45vh]">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 w-1/4">Título del Campo</th>
              <th className="text-left p-2 w-1/5">Tipo</th>
              <th className="text-left p-2 w-1/3">Opciones</th>
              <th className="text-center p-2 w-[100px]">Oblig.</th>
              <th className="w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b hover:bg-muted/30">
                <td className="p-2 align-top">
                  <Input
                    {...register(`campos.${index}.titulo`, { required: true })}
                    placeholder="Ej: Fecha de visita"
                  />
                </td>
                <td className="p-2 align-top">
                  <Controller
                    name={`campos.${index}.tipo`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposDeCampo.map(tipo => (
                            <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </td>
                <td className="p-2 align-top">
                  {(watchCampos[index]?.tipo === 'seleccion' || watchCampos[index]?.tipo === 'combobox') ? (
                    <Input
                      {...register(`campos.${index}.opciones`)}
                      placeholder="Opción 1, Opción 2"
                    />
                  ) : (
                    <div className="text-muted-foreground text-xs italic pt-2">—</div>
                  )}
                </td>
                <td className="text-center p-2 align-top">
                  <Controller
                    name={`campos.${index}.requerido`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Checkbox
                        id={`req-${index}`}
                        checked={controllerField.value}
                        onCheckedChange={controllerField.onChange}
                      />
                    )}
                  />
                </td>
                <td className="text-center p-2 align-top">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <DialogFooter className="mt-4">
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Guardando..." : "Guardar Etapa"}
      </Button>
    </DialogFooter>
  </form>
</DialogContent>
    </Dialog>
  );
}