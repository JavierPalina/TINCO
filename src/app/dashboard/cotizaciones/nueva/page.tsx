"use client";

import { useForm, useFieldArray, Controller, SubmitHandler } from 'react-hook-form';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Suspense, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';

interface ProductLine {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

interface QuoteFormData {
  productos: ProductLine[];
  montoTotal: number;
  estado: 'Borrador' | 'Enviada';
}

function CreateQuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clienteId');

  const { data: cliente, isLoading: isLoadingClient } = useQuery<{ nombreCompleto: string }>({
    queryKey: ['cliente', clientId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/clientes/${clientId}`);
      return data.data;
    },
    enabled: !!clientId,
  });

  const { register, control, handleSubmit, watch, setValue } = useForm<QuoteFormData>({
    defaultValues: {
      productos: [{ descripcion: '', cantidad: 1, precioUnitario: 0 }],
      montoTotal: 0,
      estado: 'Borrador',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'productos',
  });

  const watchedProducts = watch('productos');

  useEffect(() => {
    const total = watchedProducts.reduce((sum, item) => sum + (item.cantidad || 0) * (item.precioUnitario || 0), 0);
    setValue('montoTotal', total);
  }, [watchedProducts, setValue]);

  const mutation = useMutation({
    mutationFn: (newQuote: QuoteFormData) => {
      return axios.post(`/api/clientes/${clientId}/cotizaciones`, newQuote);
    },
    onSuccess: () => {
      router.push(`/dashboard/clientes/${clientId}`);
    },
    onError: (error) => {
      console.error("Error al crear la cotización:", error);
      alert("No se pudo crear la cotización.");
    }
  });

  const onSubmit: SubmitHandler<QuoteFormData> = (data) => {
    mutation.mutate(data);
  };

  if (!clientId) return <div className="p-10 text-center">Falta el ID del cliente. Vuelve y selecciona un cliente.</div>;
  if (isLoadingClient) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl">Crear Nueva Cotización</CardTitle>
          <CardDescription>Para el cliente: <span className="font-bold text-primary">{cliente?.nombreCompleto}</span></CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-4 border rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label>Descripción</Label>
                      <Input {...register(`productos.${index}.descripcion`, { required: true })} placeholder="Abertura de aluminio 2x1.5m" />
                    </div>
                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input type="number" {...register(`productos.${index}.cantidad`, { valueAsNumber: true, required: true, min: 1 })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Precio Unitario</Label>
                      <Input type="number" step="0.01" {...register(`productos.${index}.precioUnitario`, { valueAsNumber: true, required: true })} />
                    </div>
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={() => append({ descripcion: '', cantidad: 1, precioUnitario: 0 })}>
              Añadir Producto
            </Button>

            <hr/>

            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>${watch('montoTotal').toLocaleString('es-AR')}</span>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={mutation.isPending}>
                {mutation.isPending ? "Guardando..." : "Guardar Cotización"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateQuotePage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Cargando...</div>}>
            <CreateQuoteForm />
        </Suspense>
    );
}