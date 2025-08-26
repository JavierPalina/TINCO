"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner"; // <-- 1. Importar la función toast
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Building2 } from 'lucide-react';
import { Client } from '@/types/client';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

type CompanyFormInputs = {
  empresa?: string;
  direccionEmpresa?: string;
  ciudadEmpresa?: string;
  paisEmpresa?: string;
  razonSocial?: string;
  contactoEmpresa?: string;
  cuil?: string;
};

export function CompanyDataPopover({ client }: { client: Client }) {
  const { register, handleSubmit } = useForm<CompanyFormInputs>({
    defaultValues: {
      empresa: client.empresa || '',
      direccionEmpresa: client.direccionEmpresa || '',
      ciudadEmpresa: client.ciudadEmpresa || '',
      paisEmpresa: client.paisEmpresa || '',
      razonSocial: client.razonSocial || '',
      contactoEmpresa: client.contactoEmpresa || '',
      cuil: client.cuil || '',
    }
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CompanyFormInputs) => {
      return axios.put(`/api/clientes/${client._id}`, data);
    },
    // --- 2. AÑADIR ESTOS CALLBACKS ---
    onSuccess: () => {
      toast.success("Datos de la empresa actualizados");
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', client._id] });
      // El Popover se cierra solo al hacer clic fuera, así que no necesitamos manejarlo
    },
    onError: (error) => {
      toast.error("Error al actualizar", {
        description: "No se pudieron guardar los cambios."
      });
    },
  });

  const onSubmit: SubmitHandler<CompanyFormInputs> = (data) => mutation.mutate(data);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" className="h-7 w-7 bg-primary hover:bg-primary/90 text-primary-foreground" style={{marginLeft: "4px"}}>
          <Building2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Datos de la Empresa</h4>
            <p className="text-sm text-muted-foreground">Edita la información de la empresa asociada.</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="empresa" className="text-right">Nombre</Label><Input id="empresa" {...register("empresa")} className="col-span-2 h-8" /></div>
            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="razonSocial" className="text-right">Razón Social</Label><Input id="razonSocial" {...register("razonSocial")} className="col-span-2 h-8" /></div>
            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="cuil" className="text-right">CUIL/CUIT</Label><Input id="cuil" {...register("cuil")} className="col-span-2 h-8" /></div>
            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="contactoEmpresa" className="text-right">Contacto</Label><Input id="contactoEmpresa" {...register("contactoEmpresa")} className="col-span-2 h-8" /></div>
            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="direccionEmpresa" className="text-right">Dirección</Label><Input id="direccionEmpresa" {...register("direccionEmpresa")} className="col-span-2 h-8" /></div>
            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="ciudadEmpresa" className="text-right">Ciudad</Label><Input id="ciudadEmpresa" {...register("ciudadEmpresa")} className="col-span-2 h-8" /></div>
            <div className="grid grid-cols-3 items-center gap-4"><Label htmlFor="paisEmpresa" className="text-right">País</Label><Input id="paisEmpresa" {...register("paisEmpresa")} className="col-span-2 h-8" /></div>
          </div>
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}