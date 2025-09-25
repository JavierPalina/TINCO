"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { IFormField } from '@/types/IFormField';

interface StageFormModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    formFields: IFormField[];
    onSave: (formData: Record<string, unknown>) => Promise<void>;
    quoteId: string;
}

export function StageFormModal({ isOpen, onOpenChange, title, description, formFields, onSave }: StageFormModalProps) {
    const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm();

    const onSubmit: SubmitHandler<Record<string, unknown>> = async (data) => {
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
                                <Input id={field.titulo} {...register(field.titulo, { required: true })} />
                            )}
                            {field.tipo === 'seleccion' && (
                                <select id={field.titulo} {...register(field.titulo, { required: true })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="">Selecciona una opción</option>
                                    {field.opciones?.map((option: string) => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </select>
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
