"use client";

import { useForm, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface IUser {
  _id: string;
  name: string;
  email: string;
  rol: 'vendedor' | 'admin';
  activo: boolean;
}

interface IUserFormData {
  name: string;
  email: string;
  rol: string;
  password?: string;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IUser; // Para el modo de edición
}

export function UserFormDialog({ isOpen, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm<IUserFormData>();
  
  useEffect(() => {
    if (user) {
      // Modo edición: Pre-pobla el formulario
      reset({
        name: user.name,
        email: user.email,
        rol: user.rol,
        password: '', // No pre-poblamos la contraseña por seguridad
      });
      setValue('rol', user.rol);
    } else {
      // Modo creación: Limpia el formulario
      reset();
    }
  }, [user, reset, setValue]);

  const createMutation = useMutation<unknown, AxiosError, IUserFormData>({
    mutationFn: (data) => axios.post('/api/create-user', data),
    onSuccess: () => {
      toast.success('Usuario creado con éxito!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (error) => {
      const errorMessage = (error?.response?.data as { error: string })?.error || 'Error al crear el usuario.';
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation<unknown, AxiosError, IUserFormData>({
    mutationFn: (data) => axios.put(`/api/users/${user!._id}`, data),
    onSuccess: () => {
      toast.success('Usuario actualizado con éxito!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
    onError: (error) => {
      const errorMessage = (error?.response?.data as { error: string })?.error || 'Error al actualizar el usuario.';
      toast.error(errorMessage);
    },
  });

  const onSubmit: SubmitHandler<IUserFormData> = (data) => {
    if (user) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</DialogTitle>
          <DialogDescription>
            {user ? 'Edita los detalles del usuario.' : 'Completa el formulario para agregar un nuevo usuario.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nombre</Label>
              <Input id="name" {...register('name', { required: true })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" {...register('email', { required: true })} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rol" className="text-right">Rol</Label>
              <Select onValueChange={(value) => setValue('rol', value)} defaultValue={user?.rol}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!user && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Contraseña</Label>
                <Input id="password" type="password" {...register('password', { required: !user })} className="col-span-3" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                user ? 'Guardar Cambios' : 'Crear Usuario'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
