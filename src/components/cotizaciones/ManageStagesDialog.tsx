"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { PlusCircle } from 'lucide-react';

interface Etapa { _id: string; nombre: string; color: string; }
type FormInputs = { nombre: string; color: string; };

export function ManageStagesDialog() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormInputs>({
    defaultValues: { color: '#cccccc' }
  });

  const { data: etapas, isLoading } = useQuery<Etapa[]>({
    queryKey: ['etapasCotizacion'],
    queryFn: async () => (await axios.get('/api/etapas-cotizacion')).data.data,
  });

  const mutation = useMutation({
    mutationFn: (newStage: FormInputs) => axios.post('/api/etapas-cotizacion', newStage),
    onSuccess: () => {
      toast.success("Nueva etapa creada");
      queryClient.invalidateQueries({ queryKey: ['etapasCotizacion'] });
      reset();
    },
    onError: () => toast.error("Error al crear la etapa"),
  });

  const onSubmit = (data: FormInputs) => mutation.mutate(data);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Gestionar Etapas de Cotización</DialogTitle></DialogHeader>
        <div className="space-y-4">
            <h3 className="font-semibold">Etapas Existentes</h3>
            {isLoading && <p>Cargando...</p>}
            <div className="space-y-2">
                {etapas?.map(etapa => (
                    <div key={etapa._id} className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: etapa.color }} />
                        <span>{etapa.nombre}</span>
                    </div>
                ))}
            </div>
            <hr/>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <h3 className="font-semibold">Crear Nueva Etapa</h3>
                <div className="flex items-center gap-2">
                    <Input placeholder="Nombre de la etapa" {...register("nombre", { required: true })} />
                    <Input type="color" {...register("color")} className="w-16 p-1 h-10" />
                </div>
                <Button type="submit" disabled={mutation.isPending} className="w-full">
                    {mutation.isPending ? "Creando..." : "Añadir Etapa"}
                </Button>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}