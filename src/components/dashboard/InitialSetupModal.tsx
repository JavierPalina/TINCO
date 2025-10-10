"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from 'sonner';

type UserFormInputs = {
    name: string;
    email: string;
    password?: string;
    rol: 'vendedor' | 'admin';
};

type FormField = {
    titulo: string;
    tipo: 'texto' | 'seleccion';
    opciones?: string;
};

type StageFormInputs = {
    nombre: string;
    campos: FormField[];
};

export function InitialSetupModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formFields, setFormFields] = useState<FormField[]>([]);

    const userForm = useForm<UserFormInputs>();
    const stageForm = useForm<StageFormInputs>();

    useEffect(() => {
        const checkFirstAdmin = async () => {
            try {
                const response = await axios.get('/api/check-first-admin');
                if (response.data.isFirstAdmin) {
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Error al verificar el primer administrador:", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkFirstAdmin();
    }, []);

    const onUserSubmit: SubmitHandler<UserFormInputs> = async (data) => {
        setIsSubmitting(true);
        try {
            await axios.post('/api/create-user', {
                ...data,
                password: data.password || 'contraseñaTemporal123!',
            });
            toast.success('Usuario creado con éxito.');
            userForm.reset();
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.error || 'Error al crear el usuario.');
            } else {
                toast.error('Error al crear el usuario.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const onStageSubmit: SubmitHandler<StageFormInputs> = async (data) => {
        setIsSubmitting(true);
        try {
            const camposParsed = formFields.map(field => ({
                titulo: field.titulo,
                tipo: field.tipo,
                opciones: field.opciones ? field.opciones.split(',').map(s => s.trim()) : undefined,
            }));

            await axios.post('/api/create-stage', {
                nombre: data.nombre,
                campos: camposParsed,
            });
            toast.success('Etapa y formulario creados con éxito.');
            stageForm.reset();
            setFormFields([]);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                toast.error(error.response.data.error || 'Error al crear la etapa.');
            } else {
                toast.error('Error al crear la etapa.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const addFormField = () => {
        setFormFields([...formFields, { titulo: '', tipo: 'texto', opciones: '' }]);
    };

    const removeFormField = (index: number) => {
        const newFields = formFields.filter((_, i) => i !== index);
        setFormFields(newFields);
    };

    if (isLoading) {
        return <div className="hidden">Cargando...</div>;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[725px]">
                <DialogHeader>
                    <DialogTitle>Configuración Inicial</DialogTitle>
                    <DialogDescription>
                        Detectamos que es la primera vez que ingresas como administrador. Por favor, realiza las configuraciones iniciales.
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="users" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="users">Crear Usuarios</TabsTrigger>
                        <TabsTrigger value="stages">Crear Etapas</TabsTrigger>
                    </TabsList>
                    <TabsContent value="users" className="mt-4">
                        <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="grid gap-4">
                            <div className="grid gap-2"><Label htmlFor="name">Nombre</Label><Input id="name" {...userForm.register("name")} required /></div>
                            <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...userForm.register("email")} required /></div>
                            <div className="grid gap-2"><Label htmlFor="password">Contraseña</Label><Input id="password" type="password" {...userForm.register("password")} required /></div>
                            <div className="grid gap-2"><Label htmlFor="rol">Rol</Label>
                                <select id="rol" {...userForm.register("rol")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value="vendedor">Vendedor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</> : "Crear Usuario"}
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="stages" className="mt-4">
                        <form onSubmit={stageForm.handleSubmit(onStageSubmit)} className="grid gap-4">
                            <div className="grid gap-2"><Label htmlFor="stage-name">Nombre de Etapa</Label><Input id="stage-name" {...stageForm.register("nombre")} required /></div>
                            <h4 className="text-lg font-semibold mt-4">Formulario para esta etapa:</h4>
                            {formFields.map((field, index) => (
                                <div key={index} className="flex gap-2 items-end border p-2 rounded-md relative">
                                    <div className="grid gap-2 flex-grow">
                                        <Label>Título del Campo</Label>
                                        <Input
                                            value={field.titulo}
                                            onChange={(e) => {
                                                const newFields = [...formFields];
                                                newFields[index].titulo = e.target.value;
                                                setFormFields(newFields);
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2 flex-grow">
                                        <Label>Tipo de Campo</Label>
                                        <select
                                            value={field.tipo}
                                            onChange={(e) => {
                                                const newFields = [...formFields];
                                                newFields[index].tipo = e.target.value as 'texto' | 'seleccion';
                                                setFormFields(newFields);
                                            }}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="texto">Campo de texto</option>
                                            <option value="seleccion">Selección de opciones</option>
                                        </select>
                                    </div>
                                    {field.tipo === 'seleccion' && (
                                        <div className="grid gap-2 flex-grow">
                                            <Label>Opciones (separar con comas)</Label>
                                            <Input
                                                value={field.opciones || ''}
                                                onChange={(e) => {
                                                    const newFields = [...formFields];
                                                    newFields[index].opciones = e.target.value;
                                                    setFormFields(newFields);
                                                }}
                                                placeholder="Opción 1, Opción 2"
                                            />
                                        </div>
                                    )}
                                    <Button type="button" variant="ghost" onClick={() => removeFormField(index)} className="absolute top-2 right-2 p-1 h-6 w-6"><X className="h-4 w-4" /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addFormField} className="mt-2">
                                <Plus className="mr-2 h-4 w-4" /> Agregar Campo
                            </Button>
                            <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Etapa"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}