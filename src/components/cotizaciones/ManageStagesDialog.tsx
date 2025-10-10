"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { PlusCircle } from 'lucide-react';

interface Etapa { _id: string; nombre: string; }
type FormInputs = { nombre: string; };

export function ManageStagesDialog() {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset } = useForm<FormInputs>();

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
    const themePrimaryColor = { h: 160, s: 35, l: 48 };

    const generateColorWithOpacity = (index: number, total: number) => {
        const maxOpacity = 1.0;
        const minOpacity = 0.2;
        if (total <= 1) {
            return `hsla(${themePrimaryColor.h}, ${themePrimaryColor.s}%, ${themePrimaryColor.l}%, ${maxOpacity})`;
        }
        const opacityStep = (maxOpacity - minOpacity) / (total - 1);
        const opacity = maxOpacity - (index * opacityStep);
        
        return `hsla(${themePrimaryColor.h}, ${themePrimaryColor.s}%, ${themePrimaryColor.l}%, ${opacity})`;
    };

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
                        {etapas?.map((etapa, index) => (
                            <div key={etapa._id} className="flex items-center gap-3">
                                <div 
                                    className="h-4 w-4 rounded-full border" 
                                    style={{ backgroundColor: generateColorWithOpacity(index, etapas.length) }} 
                                />
                                <span>{etapa.nombre}</span>
                            </div>
                        ))}
                    </div>
                    <hr/>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <h3 className="font-semibold">Crear Nueva Etapa</h3>
                        <div className="flex items-center gap-2">
                            <Input placeholder="Nombre de la etapa" {...register("nombre", { required: true })} />
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