"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { useDebounce } from "use-debounce";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { UserFormDialog } from "@/components/users/UserFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  IContactData,
  IFinancieraLegalData,
  ILaboralData,
  IPersonalData,
} from "@/models/User";
import type { UserRole } from "@/lib/roles";

type SucursalLite = { _id: string; nombre: string };

export interface IUser2 {
  _id: string;
  name: string;
  email: string;
  rol: UserRole;
  activo: boolean;
  sucursal?: SucursalLite | null;

  personalData?: IPersonalData;
  contactData?: IContactData;
  laboralData?: ILaboralData;
  financieraLegalData?: IFinancieraLegalData;
}

type ApiListResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
};

type Sucursal = {
  _id: string;
  nombre: string;
  direccion: string;
};

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || err.message || "Error";
  }
  if (err instanceof Error) return err.message;
  return "Error";
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser2 | undefined>(undefined);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // ✅ filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 400);

  // "all" | "none" | ObjectId
  const [sucursalFilter, setSucursalFilter] = useState<string>("all");

  // ✅ loading por fila asignación
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);

  const roleLabel: Record<UserRole, string> = useMemo(
    () => ({
      vendedor: "Vendedor",
      gerente: "Gerente",
      tecnico: "Técnico",
      tecnico_taller: "Técnico de Taller",
      administrativo: "Administrativo",
      deposito: "Depósito",
      logistica: "Logística",
      post_venta: "Post Venta",
      admin: "Admin",
    }),
    []
  );

  // ✅ sucursales para el filtro y para el selector de asignación
  const { data: sucursales } = useQuery<Sucursal[]>({
    queryKey: ["sucursales-lite"],
    queryFn: async () => {
      const { data } = await axios.get<{ ok: boolean; data: Sucursal[] }>("/api/sucursales");
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const usersQueryKey = useMemo(
    () => ["users", debouncedSearchTerm, sucursalFilter],
    [debouncedSearchTerm, sucursalFilter]
  );

  const { data: users, isLoading, error, isFetching } = useQuery<IUser2[]>({
    queryKey: usersQueryKey,
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (debouncedSearchTerm.trim()) params.searchTerm = debouncedSearchTerm.trim();

      if (sucursalFilter !== "all") {
        params.sucursalId = sucursalFilter; // "none" o ObjectId
      }

      const { data } = await axios.get<ApiListResponse<IUser2[]>>("/api/users", { params });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });

  const assignSucursalMutation = useMutation({
    mutationFn: async (payload: { userId: string; sucursalId: string | null }) => {
      const res = await axios.put(`/api/users/${payload.userId}`, {
        sucursalId: payload.sucursalId,
      });
      return res.data;
    },
    onMutate: async (payload) => {
      setAssigningUserId(payload.userId);
    },
    onSuccess: () => {
      toast.success("Sucursal asignada correctamente.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err) || "Error al asignar la sucursal.");
    },
    onSettled: () => {
      setAssigningUserId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => axios.delete(`/api/users/${userId}`),
    onSuccess: () => {
      toast.success("Usuario eliminado correctamente.");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserToDelete(null);
    },
    onError: () => {
      toast.error("Error al eliminar el usuario.");
    },
  });

  const handleDeleteClick = (userId: string) => setUserToDelete(userId);

  const handleConfirmDelete = () => {
    if (userToDelete) deleteMutation.mutate(userToDelete);
  };

  const handleEdit = async (userSummary: IUser2) => {
    const promise = async (): Promise<IUser2> => {
      const { data } = await axios.get<ApiListResponse<IUser2>>(`/api/users/${userSummary._id}`);
      if (!data.success) {
        throw new Error(data.error || "No se pudieron cargar los datos del usuario.");
      }
      return data.data;
    };

    toast.promise(promise(), {
      loading: "Cargando datos del usuario...",
      success: (fullUser) => {
        setEditingUser(fullUser);
        setIsFormOpen(true);
        return "Datos cargados con éxito.";
      },
      error: (err: unknown) => getErrorMessage(err) || "Error al cargar los datos.",
    });
  };

  const handleAdd = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const onSucursalChange = (userId: string, value: string) => {
    const sucursalId = value === "none" ? null : value;
    assignSucursalMutation.mutate({ userId, sucursalId });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500">Error: No se pudieron cargar los usuarios.</div>;
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <div className="text-sm text-muted-foreground mt-1">
            Buscá por nombre/email y filtrá por sucursal.
          </div>
        </div>

        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Usuario
        </Button>
      </div>

      {/* ✅ Filtros */}
      <div className="grid gap-3 md:grid-cols-3 items-end">
        <div className="grid gap-1 md:col-span-2">
          <label className="text-sm font-medium">Buscar</label>
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre o email..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Sucursal</label>
          <Select value={sucursalFilter} onValueChange={setSucursalFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="none">Sin asignar</SelectItem>
              {(sucursales || []).map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isFetching ? (
          <div className="md:col-span-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Actualizando...
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Sucursal (asignación rápida)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {(users || []).map((user) => {
              const currentValue = user.sucursal?._id ?? "none";
              const rowSaving = assigningUserId === user._id;

              return (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>

                  <TableCell>
                    <Badge variant="secondary">{roleLabel[user.rol] ?? user.rol}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={user.activo ? "default" : "destructive"}>
                      {user.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="min-w-[240px]">
                      <Select
                        value={currentValue}
                        onValueChange={(v) => onSucursalChange(user._id, v)}
                        disabled={rowSaving}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Asignar sucursal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          {(sucursales || []).map((s) => (
                            <SelectItem key={s._id} value={s._id}>
                              {s.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {rowSaving ? (
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Guardando...
                        </div>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEdit(user)}
                      aria-label="Editar usuario"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(user._id)}
                      aria-label="Eliminar usuario"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {(users || []).length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            No se encontraron usuarios con esos filtros.
          </div>
        ) : null}
      </div>

      <UserFormDialog isOpen={isFormOpen} onOpenChange={setIsFormOpen} user={editingUser} />

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
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
