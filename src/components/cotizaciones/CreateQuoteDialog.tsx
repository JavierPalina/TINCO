"use client";

import { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Client } from '@/types/client';
import { ManageStagesDialog } from './ManageStagesDialog';
import { Paperclip, X } from 'lucide-react';

interface Etapa { _id: string; nombre: string; color: string; }
type FormInputs = { cliente: string; etapa: string; montoTotal: number; detalle?: string; };

export function CreateQuoteDialog() {
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [displayAmount, setDisplayAmount] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, setValue, watch } = useForm<FormInputs>({
    defaultValues: { cliente: '', etapa: '', montoTotal: 0, detalle: '' }
  });

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'montoTotal') {
        const numValue = Number(value.montoTotal) || 0;
        setDisplayAmount(new Intl.NumberFormat('es-AR').format(numValue));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const numValue = parseInt(rawValue, 10) || 0;
    setValue('montoTotal', numValue, { shouldValidate: true });
  };
  
  const { data: clientes, isLoading: isLoadingClientes } = useQuery<Client[]>({
    queryKey: ['clientes'],
    queryFn: async () => (await axios.get('/api/clientes')).data.data,
  });
  
  const { data: etapas, isLoading: isLoadingEtapas } = useQuery<Etapa[]>({
    queryKey: ['etapasCotizacion'],
    queryFn: async () => (await axios.get('/api/etapas-cotizacion')).data.data,
  });

  const mutation = useMutation({
    mutationFn: async (formData: FormInputs) => {
      let filePaths: string[] = [];
      if (selectedFiles.length > 0) {
        const fileFormData = new FormData();
        selectedFiles.forEach(file => fileFormData.append('files', file));
        const uploadResponse = await axios.post('/api/upload', fileFormData);
        filePaths = uploadResponse.data.paths;
      }
      const quoteData = { ...formData, archivos: filePaths };
      return axios.post('/api/cotizaciones', quoteData);
    },
    onSuccess: () => {
      toast.success("Cotización creada con éxito");
      queryClient.invalidateQueries({ queryKey: ['cotizacionesPipeline'] });
      reset();
      setSelectedFiles([]);
      setDisplayAmount('');
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOpen(false);
    },
    onError: () => toast.error("Error al crear la cotización."),
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => mutation.mutate(data);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setSelectedFiles(prevFiles => {
          const combined = [...prevFiles, ...newFiles];
          const uniqueFiles = combined.filter((file, index, self) => 
            index === self.findIndex((f) => f.name === file.name && f.size === file.size)
          );
          if (uniqueFiles.length > 10) {
            toast.error("Puedes subir un máximo de 10 archivos.");
            return prevFiles;
          }
          return uniqueFiles;
      });
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setSelectedFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
  };

  const clienteOptions = clientes?.map(c => ({ value: c._id, label: c.nombreCompleto })) || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Crear Cotización</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva Cotización</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Cliente *</Label>
            <Controller name="cliente" control={control} rules={{ required: true }} render={({ field }) => (
              <Combobox 
                options={clienteOptions} 
                value={field.value} 
                onChange={field.onChange} 
                placeholder="Buscar cliente..."
                searchText={isLoadingClientes ? "Cargando..." : "Buscar cliente..."}
              />
            )} />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-grow space-y-2">
              <Label>Etapa Inicial *</Label>
              <Controller name="etapa" control={control} rules={{ required: true }} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingEtapas}>
                  <SelectTrigger><SelectValue placeholder={isLoadingEtapas ? "Cargando..." : "Seleccionar..."} /></SelectTrigger>
                  <SelectContent>
                    {etapas?.map(e => <SelectItem key={e._id} value={e._id}>{e.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <ManageStagesDialog />
          </div>
          <div>
            <Label>Monto Total (ARS) *</Label>
            <Input 
                type="text"
                placeholder="250.000" 
                value={displayAmount} 
                onChange={handleAmountChange} 
            />
          </div>
          <div>
            <Label>Detalle (Opcional)</Label>
            <Textarea placeholder="Ej: Ventana de aluminio 2x1.5m, colocación incluida." {...control.register("detalle")} />
          </div>
          <div>
            <Label>Adjuntar Archivos (hasta 10)</Label>
            <div className="flex items-center gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4 mr-2" />
                    {selectedFiles.length > 0 ? 'Añadir más' : 'Adjuntar'}
                </Button>
                <span className="text-sm text-muted-foreground">{selectedFiles.length} archivo(s)</span>
            </div>
            <Input ref={fileInputRef} type="file" multiple accept="image/*,.pdf" onChange={handleFileChange} className="hidden" />
            <div className="mt-2 space-y-2">
              {selectedFiles.map(file => (
                <div key={file.name} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                  <span className="truncate pr-2">{file.name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(file.name)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? "Creando..." : "Crear y Agendar Tarea"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}