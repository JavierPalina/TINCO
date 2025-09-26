"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface StageFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    formFields: any[];
    onSave: (formData: any) => Promise<void>;
    quoteId: string;
}

export function StageFormModal({ isOpen, onOpenChange, title, description, formFields, onSave }: StageFormModalProps) {
    const { 
        register, 
        handleSubmit, 
        formState: { isSubmitting, errors },    
        reset 
    } = useForm();

    const onSubmit: SubmitHandler<any> = async (data) => {
        try {
            await onSave(data);
            reset();
            onOpenChange(false);
        } catch (error) {
            toast.error("Error al guardar los datos del formulario.");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {formFields.map((field, index) => (
                        <div key={index} className="grid gap-2">
                            <Label htmlFor={field.titulo}>{field.titulo}</Label>
                            
                            {field.tipo === 'texto' && (
                                <>
                                    <Input 
                                        id={field.titulo} 
                                        {...register(field.titulo, { required: true })} 
                                        className={errors[field.titulo] ? "border-red-500" : ""}
                                    />
                                    {errors[field.titulo] && (
                                        <p className="text-sm font-medium text-red-500">
                                            Este campo es requerido.
                                        </p>
                                    )}
                                </>
                            )}
                            
                            {field.tipo === 'seleccion' && (
                                <>
                                    <select 
                                        id={field.titulo} 
                                        {...register(field.titulo, { required: true })} 
                                        className={`flex h-10 w-full rounded-md border ${errors[field.titulo] ? 'border-red-500' : 'border-input'} bg-background px-3 py-2 text-sm`}
                                    >
                                        {/* ✅ CORRECCIÓN CLAVE: disabled y hidden en la opción por defecto */}
                                        <option value="" disabled hidden>Selecciona una opción</option>
                                        {field.opciones.map((option: string) => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    {errors[field.titulo] && (
                                        <p className="text-sm font-medium text-red-500">
                                            Debes seleccionar una opción.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar y Mover'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}