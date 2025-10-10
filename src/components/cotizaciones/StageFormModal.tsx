"use client";

import { useEffect, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Paperclip, X } from 'lucide-react';
import { IFormField as OriginalFormField } from '@/types/IFormField'; // Asegúrate que esta ruta sea correcta
import { Combobox } from '@/components/ui/combobox'; // Asumo que tienes este componente

type IFormField = Omit<OriginalFormField, 'tipo'> & {
    tipo: 'texto' | 'textarea' | 'numero' | 'fecha' | 'checkbox' | 'seleccion' | 'combobox' | 'archivo';
};

type IFormularioData = Record<string, any>;

interface StageFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    formFields: IFormField[]; 
    onSave: (formData: IFormularioData) => Promise<void>; 
    quoteId: string;
}

// Helper para convertir el título en un nombre de campo válido para react-hook-form
const toFieldName = (title: string): string => {
    return title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export function StageFormModal({ isOpen, onOpenChange, title, description, formFields, onSave }: StageFormModalProps) {
    const { 
        control,
        handleSubmit, 
        formState: { isSubmitting },
        reset 
    } = useForm<IFormularioData>();

    const [filesToUpload, setFilesToUpload] = useState<Record<string, File[]>>({});

    useEffect(() => {
        if (isOpen) {
            // Resetea el formulario y los archivos cada vez que el modal se abre
            reset();
            setFilesToUpload({});
        }
    }, [isOpen, reset]);

    const handleFileChange = (fieldName: string, event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            setFilesToUpload(prev => ({
                ...prev,
                [fieldName]: [...(prev[fieldName] || []), ...newFiles]
            }));
        }
    };
    
    const removeFile = (fieldName: string, fileNameToRemove: string) => {
        setFilesToUpload(prev => ({
            ...prev,
            [fieldName]: prev[fieldName].filter(file => file.name !== fileNameToRemove)
        }));
    };

    const onSubmit: SubmitHandler<IFormularioData> = async (data) => {
        let finalFormData = { ...data };

        try {
            const fileUploadPromises: Promise<void>[] = [];
            
            for (const fieldName in filesToUpload) {
                const files = filesToUpload[fieldName];
                if (files.length > 0) {
                    const uploadPromise = async () => {
                        const formData = new FormData();
                        files.forEach(file => formData.append('files', file));
                        
                        const response = await axios.post('/api/upload', formData);
                        // Guarda las rutas de los archivos en el objeto de datos final
                        finalFormData[fieldName] = response.data.paths;
                    };
                    const promise = uploadPromise();
                    fileUploadPromises.push(promise);
                    toast.promise(promise, {
                        loading: `Subiendo ${files.length} archivo(s)...`,
                        success: 'Archivos subidos con éxito.',
                        error: 'Error al subir archivos.'
                    });
                }
            }

            // Espera a que todas las subidas de archivos terminen
            await Promise.all(fileUploadPromises);
            
            // Llama a la función onSave con todos los datos (incluyendo las rutas de los archivos)
            await onSave(finalFormData);
            
            onOpenChange(false); // Cierra el modal solo si todo fue exitoso

        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : "Error desconocido.";
            toast.error(`Error en el proceso de guardado: ${errorMessage}`);
        }
    };

    const renderField = (field: IFormField) => {
        const fieldName = toFieldName(field.titulo);
        const rules = { required: field.requerido ? 'Este campo es obligatorio.' : false };
        
        switch (field.tipo) {
            case 'texto':
                return <Input type="text" {...control.register(fieldName, rules)} />;
            case 'textarea':
                return <Textarea {...control.register(fieldName, rules)} />;
            case 'numero':
                return <Input type="number" {...control.register(fieldName, { ...rules, valueAsNumber: true })} />;
            case 'fecha':
                return <Input type="date" {...control.register(fieldName, rules)} />;
            case 'checkbox':
                return (
                    <div className='flex items-center space-x-2'>
                        <Controller name={fieldName} control={control} render={({ field: controllerField }) => <Checkbox id={fieldName} checked={!!controllerField.value} onCheckedChange={controllerField.onChange} />} />
                        <Label htmlFor={fieldName} className='text-sm font-normal'>{field.titulo}</Label>
                    </div>
                );
            case 'seleccion':
                return (
                    <Controller
                        name={fieldName} control={control} rules={rules}
                        render={({ field: controllerField }) => (
                            <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent>
                                    {field.opciones?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                );
            case 'combobox':
                const comboboxOptions = field.opciones?.map(opt => ({ value: opt, label: opt })) || [];
                return (
                    <Controller
                        name={fieldName} control={control} rules={rules}
                        render={({ field: controllerField }) => (
                            <Combobox options={comboboxOptions} value={controllerField.value} onChange={controllerField.onChange} placeholder="Buscar y seleccionar..." />
                        )}
                    />
                );
            case 'archivo':
                return (
                    <div>
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(fieldName)?.click()}>
                            <Paperclip className="h-4 w-4 mr-2" /> Adjuntar Archivos
                        </Button>
                        <Input id={fieldName} type="file" multiple className="hidden" onChange={(e) => handleFileChange(fieldName, e)} />
                        <div className="mt-2 space-y-1">
                            {(filesToUpload[fieldName] || []).map(file => (
                                <div key={file.name} className="flex items-center justify-between text-xs p-1.5 bg-muted rounded-md">
                                    <span className="truncate pr-2">{file.name}</span>
                                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(fieldName, file.name)}><X className="h-3 w-3" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return <p className='text-red-500 text-sm'>Tipo de campo no reconocido: {field.tipo}</p>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    {formFields.map((field) => (
                        // El checkbox se renderiza con su propio label, así que lo excluimos de este div
                        field.tipo !== 'checkbox' ? (
                            <div key={field.titulo} className="space-y-2">
                                <Label>{field.titulo} {field.requerido && <span className="text-red-500">*</span>}</Label>
                                {renderField(field)}
                            </div>
                        ) : (
                            <div key={field.titulo}>
                                {renderField(field)}
                            </div>
                        )
                    ))}
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar y Mover'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}