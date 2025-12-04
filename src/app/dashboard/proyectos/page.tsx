"use client";

// Imports de React y Next
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

// Imports de TanStack (React Query)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Imports de TanStack (React Table)
import { ColumnDef } from "@tanstack/react-table";

// Imports de UI (shadcn)
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

// Icons
import {
  Loader2,
  ArrowUpDown,
  MoreHorizontal,
  Search,
  Filter,
} from "lucide-react";

// Otros
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";

// Componentes locales
import { CreateProjectModal } from "@/components/proyectos/CreateProjectModal";
import { IProyecto } from "@/models/Proyecto";

const ALL_VALUE = "__all";

// --- FUNCIÓN DE FETCH ---
async function fetchProyectos(): Promise<IProyecto[]> {
  const { data } = await axios.get("/api/proyectos?populate=cliente,vendedor");
  return data.data;
}

// Helper para color de estado
const getEstadoBadgeColor = (estado: string) => {
  switch (estado) {
    case "Taller":
      return "bg-orange-500 hover:bg-orange-600";
    case "Logística":
      return "bg-blue-500 hover:bg-blue-600";
    case "Completado":
      return "bg-green-600 hover:bg-green-700";
    case "Visita Técnica":
      return "bg-purple-500 hover:bg-purple-600";
    case "Medición":
      return "bg-purple-600 hover:bg-purple-700";
    case "Verificación":
      return "bg-yellow-600 hover:bg-yellow-700 text-black";
    default:
      return "bg-gray-400 hover:bg-gray-500";
  }
};

// --- COMPONENTE DE LA PÁGINA ---
export default function ProyectosDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Estado para el modal de CREAR
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- ESTADO PARA EL MODAL DE ELIMINAR ---
  const [proyectoAEliminar, setProyectoAEliminar] = useState<IProyecto | null>(
    null,
  );

  // 🔍 Buscador global
  const [searchTerm, setSearchTerm] = useState("");

  // 🎛️ Filtros select
  const [estadoFilter, setEstadoFilter] =
    useState<string | typeof ALL_VALUE>(ALL_VALUE);
  const [vendedorFilter, setVendedorFilter] =
    useState<string | typeof ALL_VALUE>(ALL_VALUE);
  const [clienteFilter, setClienteFilter] =
    useState<string | typeof ALL_VALUE>(ALL_VALUE);

  // Query para obtener los proyectos
  const {
    data: proyectos,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["proyectos"],
    queryFn: fetchProyectos,
  });

  // --- MUTACIÓN PARA ELIMINAR ---
  const deleteMutation = useMutation({
    mutationFn: (proyectoId: string) =>
      axios.delete(`/api/proyectos/${proyectoId}`),
    onSuccess: () => {
      toast.success("Proyecto eliminado con éxito");
      queryClient.invalidateQueries({ queryKey: ["proyectos"] });
      setProyectoAEliminar(null); // Cerrar el modal
    },
    onError: (error: any) => {
      toast.error(
        "Error al eliminar el proyecto: " +
          (error.response?.data?.error || error.message),
      );
      setProyectoAEliminar(null); // Cerrar el modal
    },
  });

  // --- OPCIONES ÚNICAS PARA LOS SELECTS ---
  const { estadoOptions, vendedorOptions, clienteOptions } = useMemo(() => {
    const estados = new Set<string>();
    const vendedores = new Set<string>();
    const clientes = new Set<string>();

    (proyectos || []).forEach((p) => {
      if (p.estadoActual) estados.add(p.estadoActual);

      const vendedor: any = p.vendedor;
      const vendedorName =
        vendedor && typeof vendedor === "object" ? vendedor.name : undefined;
      if (vendedorName) vendedores.add(vendedorName);

      const cliente: any = p.cliente;
      const clienteName =
        cliente && typeof cliente === "object"
          ? cliente.nombreCompleto
          : undefined;
      if (clienteName) clientes.add(clienteName);
    });

    return {
      estadoOptions: Array.from(estados).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
      vendedorOptions: Array.from(vendedores).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
      clienteOptions: Array.from(clientes).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    };
  }, [proyectos]);

  const clearFilters = () => {
    setEstadoFilter(ALL_VALUE);
    setVendedorFilter(ALL_VALUE);
    setClienteFilter(ALL_VALUE);
  };

  // --- APLICAR BUSCADOR + FILTROS ---
  const filteredProyectos: IProyecto[] = useMemo(() => {
    if (!proyectos) return [];

    const q = searchTerm.trim().toLowerCase();

    return proyectos.filter((p) => {
      const cliente: any = p.cliente || {};
      const vendedor: any = p.vendedor || {};

      const clienteNombre = cliente?.nombreCompleto || "";
      const clienteTelefono = cliente?.telefono || "";
      const clienteDireccion = cliente?.direccion || "";
      const vendedorNombre = vendedor?.name || "";
      const estadoActual = p.estadoActual || "";
      const numeroOrden = p.numeroOrden || "";

      // 🎛️ Filtro por Estado Actual
      if (estadoFilter !== ALL_VALUE && estadoActual !== estadoFilter) {
        return false;
      }

      // 🎛️ Filtro por Vendedor
      if (
        vendedorFilter !== ALL_VALUE &&
        vendedorNombre &&
        vendedorNombre !== vendedorFilter
      ) {
        return false;
      }

      // 🎛️ Filtro por Cliente
      if (
        clienteFilter !== ALL_VALUE &&
        clienteNombre &&
        clienteNombre !== clienteFilter
      ) {
        return false;
      }

      // 🔍 Buscador global
      if (q) {
        const textoBuscable = [
          clienteNombre,
          clienteTelefono,
          clienteDireccion,
          estadoActual,
          vendedorNombre,
          numeroOrden?.toString(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!textoBuscable.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [proyectos, searchTerm, estadoFilter, vendedorFilter, clienteFilter]);

  // --- DEFINICIÓN DE COLUMNAS ---
  const columns = useMemo<ColumnDef<IProyecto>[]>(
    () => [
      {
        accessorKey: "numeroOrden",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            N° Orden
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.original.numeroOrden}</div>
        ),
      },
      {
        accessorKey: "cliente.nombreCompleto",
        header: "Cliente",
        cell: ({ row }) => {
          const cliente = row.original.cliente as any;
          return typeof cliente === "string"
            ? "N/A"
            : cliente?.nombreCompleto || "N/A";
        },
      },
      {
        accessorKey: "estadoActual",
        header: "Estado Actual",
        cell: ({ row }) => {
          const estado = row.original.estadoActual;
          return (
            <Badge className={getEstadoBadgeColor(estado)}>{estado}</Badge>
          );
        },
      },
      {
        accessorKey: "vendedor.name",
        header: "Vendedor",
        cell: ({ row }) => {
          const vendedor = row.original.vendedor as any;
          return typeof vendedor === "string"
            ? "N/A"
            : vendedor?.name || "N/A";
        },
      },
      {
        accessorKey: "createdAt",
        header: "Fecha de Creación",
        cell: ({ row }) => {
          const dateField =
            (row.original as any).createdAt ||
            (row.original as any).fecha;
          return dateField
            ? new Date(dateField).toLocaleDateString()
            : "N/A";
        },
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const proyecto = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <Link href={`/dashboard/proyectos/${proyecto._id}`}>
                  <DropdownMenuItem className="cursor-pointer">
                    Ver / Editar Proyecto
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="text-red-600 cursor-pointer"
                  onClick={() => setProyectoAEliminar(proyecto)}
                >
                  Eliminar Proyecto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [],
  ); // El array vacío asegura que 'columns' no se recalcule innecesariamente

  // --- RENDER ---
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 text-red-500">Error al cargar los proyectos.</div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* MODAL DE CREAR */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {/* MODAL DE ELIMINAR */}
      <AlertDialog
        open={!!proyectoAEliminar}
        onOpenChange={() => setProyectoAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente
              el proyecto
              <strong className="mx-1">
                {proyectoAEliminar?.numeroOrden}
              </strong>
              de tus servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (proyectoAEliminar) {
                  deleteMutation.mutate(proyectoAEliminar._id as string);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Sí, eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* HEADER + ACCIONES */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tablero de Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná todos los proyectos y filtralos por estado, vendedor o
            cliente.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          + Nuevo Proyecto
        </Button>
      </div>

      {/* BUSCADOR + BOTÓN DE FILTROS (popover) */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Buscador global */}
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, número de orden, estado, vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtros avanzados en dropdown */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="inline-flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros avanzados
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[360px] sm:w-[520px]"
            align="end"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">Filtros de proyectos</p>
                <p className="text-xs text-muted-foreground">
                  Filtrá por estado actual, vendedor y cliente.
                </p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-primary hover:underline"
              >
                Limpiar
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Estado Actual */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Estado actual</p>
                <Select
                  value={estadoFilter}
                  onValueChange={(val) =>
                    setEstadoFilter(val as string | typeof ALL_VALUE)
                  }
                >
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                    {estadoOptions.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vendedor */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Vendedor</p>
                <Select
                  value={vendedorFilter}
                  onValueChange={(val) =>
                    setVendedorFilter(val as string | typeof ALL_VALUE)
                  }
                >
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                    {vendedorOptions.map((vend) => (
                      <SelectItem key={vend} value={vend}>
                        {vend}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente */}
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Cliente</p>
                <Select
                  value={clienteFilter}
                  onValueChange={(val) =>
                    setClienteFilter(val as string | typeof ALL_VALUE)
                  }
                >
                  <SelectTrigger className="h-8 w-full text-xs">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                    {clienteOptions.map((cli) => (
                      <SelectItem key={cli} value={cli}>
                        {cli}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* TABLA */}
      {filteredProyectos && (
        <DataTable columns={columns} data={filteredProyectos} />
      )}
    </div>
  );
}
