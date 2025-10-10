"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Client } from '@/types/client';

type Props = {
  client: Partial<Client>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  getValues: () => Partial<CompanyFormInputs>; 
  setValue: <K extends keyof CompanyFormInputs>(name: K, value: CompanyFormInputs[K]) => void;
};

type CompanyFormInputs = {
  empresa?: string;
  direccionEmpresa?: string;
  ciudadEmpresa?: string;
  paisEmpresa?: string;
  razonSocial?: string;
  contactoEmpresa?: string;
  cuil?: string;
};

export function CompanyDataDialog({ client, isOpen, onOpenChange, getValues, setValue }: Props) {
  const { register, handleSubmit } = useForm<CompanyFormInputs>({
    defaultValues: {
      empresa: getValues().empresa || '',
      razonSocial: getValues().razonSocial || '',
      cuil: getValues().cuil || '',
      contactoEmpresa: getValues().contactoEmpresa || '',
      direccionEmpresa: getValues().direccionEmpresa || '',
      ciudadEmpresa: getValues().ciudadEmpresa || '',
      paisEmpresa: getValues().paisEmpresa || '',
    }
  });
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CompanyFormInputs) => {
      if (!client._id) throw new Error("Client ID is missing");
      return axios.put(`/api/clientes/${client._id}`, data);
    },
    onSuccess: () => {
      toast.success("Datos de la empresa actualizados");
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente', client._id] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Error al actualizar los datos de la empresa");
    },
  });

  const onSubmit: SubmitHandler<CompanyFormInputs> = (data) => {
    if (client._id) {
      mutation.mutate(data);
    } else {
      Object.entries(data).forEach(([key, value]) => {
        setValue(key as keyof CompanyFormInputs, value);
      });
      toast.info("Datos de la empresa guardados temporalmente");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Datos de la Empresa</DialogTitle>
            <DialogDescription>
              Completa o edita la información de la empresa asociada.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Nombre Empresa</Label><Input {...register("empresa")} /></div>
            <div className="space-y-2"><Label>Razón Social</Label><Input {...register("razonSocial")} /></div>
            <div className="space-y-2"><Label>CUIL/CUIT</Label><Input {...register("cuil")} /></div>
            <div className="space-y-2"><Label>Contacto Empresa</Label><Input {...register("contactoEmpresa")} /></div>
            <div className="space-y-2"><Label>Dirección Empresa</Label><Input {...register("direccionEmpresa")} /></div>
            <div className="space-y-2"><Label>Ciudad Empresa</Label><Input {...register("ciudadEmpresa")} /></div>
            <div className="md:col-span-2 space-y-2"><Label>País Empresa</Label><Input {...register("paisEmpresa")} /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {client._id && mutation.isPending ? "Guardando..." : "Aceptar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}