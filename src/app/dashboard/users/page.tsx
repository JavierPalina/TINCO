"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface IUser {
  _id: string;
  name: string;
  email: string;
  rol: 'admin' | 'vendedor';
  activo: boolean;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null); // Estado para el modal de eliminación

  const { data: users, isLoading, error } = useQuery<IUser[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await axios.get('/api/users');
      return data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => axios.delete(`/api/users/${userId}`),
    onSuccess: () => {
      toast.success('Usuario eliminado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null); // Cerrar el modal
    },
    onError: () => {
      toast.error('Error al eliminar el usuario.');
    },
  });

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
    }
  };

  const handleEdit = (user: IUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: No se pudieron cargar los usuarios.</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Usuario
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell><Badge variant="secondary">{user.rol}</Badge></TableCell>
              <TableCell>
                <Badge variant={user.activo ? 'default' : 'destructive'}>
                  {user.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" className="mr-2" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(user._id)}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <UserFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={editingUser}
      />

      {/* Modal de confirmación para eliminar */}
            <AlertDialog 
                open={!!userToDelete} 
                onOpenChange={(open) => {
                    if (!open) {
                        setUserToDelete(null);
                    }
                }}
                >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás completamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el usuario.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmDelete} 
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}