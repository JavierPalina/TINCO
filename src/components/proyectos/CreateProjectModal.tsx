"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ICliente } from '@/models/Cliente';
import { ICotizacion } from '@/models/Cotizacion';
import { useEffect } from 'react';

// --- Esquema de Validación ---
const nuevoProyectoSchema = z.object({
  clienteId: z.string().min(1, "Debes seleccionar un cliente."),
  cotizacionId: z.string().optional(), // La cotización es opcional
});
type FormValues = z.infer<typeof nuevoProyectoSchema>;

// --- Funciones para Cargar Datos ---
async function fetchClientes(): Promise<ICliente[]> {
  const { data } = await axios.get('/api/clientes');
  return data.data;
}

// 2. FUNCIÓN DE FETCH MODIFICADA (acepta clienteId)
async function fetchCotizacionesPorCliente(
  clienteId: string | null,
): Promise<ICotizacion[]> {
  if (!clienteId) return [];
  const { data } = await axios.get(`/api/cotizaciones?clienteId=${clienteId}`);
  return data.data;
}

// --- Componente del Modal ---
interface CreateProjectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({
  isOpen,
  onOpenChange,
}: CreateProjectModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Cargar clientes para el desplegable
  const { data: clientes, isLoading: isLoadingClientes } = useQuery<ICliente[]>({
    queryKey: ['clientes'],
    queryFn: fetchClientes,
  });

  // 3. Configurar Formulario
  const form = useForm<FormValues>({
    resolver: zodResolver(nuevoProyectoSchema),
  });

  // 4. "ESCUCHAR" el campo clienteId
  const selectedClienteId = form.watch('clienteId');

  // 5. Cargar cotizaciones *dependiendo* del cliente seleccionado
  const { data: cotizaciones, isLoading: isLoadingCotizaciones } = useQuery<ICotizacion[]>({
    queryKey: ['cotizaciones', selectedClienteId],
    queryFn: () => fetchCotizacionesPorCliente(selectedClienteId),
    enabled: !!selectedClienteId,
  });

  // 6. Resetear el campo de cotización si el cliente cambia
  useEffect(() => {
    form.setValue('cotizacionId', undefined);
  }, [selectedClienteId, form]);

  // 7. Configurar Mutación (POST a /api/proyectos)
  const mutation = useMutation({
    mutationFn: (values: FormValues) => axios.post('/api/proyectos', values),
    onSuccess: (response) => {
      toast.success('¡Proyecto creado con éxito!');
      queryClient.invalidateQueries({ queryKey: ['proyectos'] });

      const nuevoProyecto = response.data.data;

      onOpenChange(false);
      form.reset();

      router.push(`/dashboard/proyectos/${nuevoProyecto._id}`);
    },
    onError: (error: unknown) => {
      let message = 'Error desconocido';

      if (axios.isAxiosError(error)) {
        message = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }

      toast.error('Error al crear el proyecto: ' + message);
    },
  });

  // 8. Handler de Envío
  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Orden de Trabajo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="clienteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (*)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingClientes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingClientes
                              ? 'Cargando clientes...'
                              : 'Seleccionar un cliente'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clientes?.map((cliente) => (
                        <SelectItem
                          key={String(cliente._id)}          // 👈 forzamos string
                          value={String(cliente._id)}        // 👈 value también string
                        >
                          {cliente.nombreCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cotizacionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cotización (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingCotizaciones || !selectedClienteId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !selectedClienteId
                              ? 'Selecciona un cliente primero'
                              : isLoadingCotizaciones
                              ? 'Buscando cotizaciones...'
                              : 'Vincular una cotización'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cotizaciones && cotizaciones.length > 0 ? (
                        cotizaciones.map((cotizacion) => (
                          <SelectItem
                            key={String(cotizacion._id)}     // 👈 idem
                            value={String(cotizacion._id)}   // 👈 idem
                          >
                            {cotizacion.codigo} (Monto: ${cotizacion.montoTotal})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="disabled" disabled>
                          No hay cotizaciones para este cliente
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Crear Proyecto
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
