"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AddClientDialog } from "@/components/clientes/AddClientDialog";
import { AddProveedorDialog } from "@/components/proveedores/AddProveedorDialog";
import { AddEmpresaDialog } from "@/components/empresas/AddEmpresaDialog";
import { ClientActions } from "@/components/clientes/ClientActions";
import { CompanyDataPopover } from "@/components/clientes/CompanyDataPopover";
import { TableCellActions } from "@/components/clientes/TableCellActions";
import { WhatsAppButton } from "@/components/clientes/WhatsAppButton";
import { EmailButton } from "@/components/clientes/EmailButton";
import { ImportClientsDialog } from "@/components/clientes/ImportClientsDialog";
import { ClientFilters } from "@/components/clientes/ClientFilters";
import { ClientMobileCard } from "@/components/clientes/ClientMobileCard";

import { CSVLink } from "react-csv";
import { Download, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";

// Si querés tipar proveedores/empresas estrictamente, creá types propios.
// Por simplicidad, uso "any" en proveedores/empresas y mantengo Client para clientes.
import { Client } from "@/types/client";

type ListType = "clientes" | "proveedores" | "empresas";

// -----------------------------
// Utilidades
// -----------------------------
const formatAndTruncate = (
  text: string | null | undefined,
  maxLength: number
): string => {
  if (!text || typeof text !== "string") return "-";

  const formattedText = text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (formattedText.length > maxLength) {
    return formattedText.substring(0, maxLength).trim() + "...";
  }

  return formattedText;
};

type ColumnVisibilityClientes = {
  "Nombre Completo": boolean;
  "Teléfono": boolean;
  Email: boolean;
  Dirección: boolean;
  Ciudad: boolean;
  País: boolean;
  DNI: boolean;
  Prioridad: boolean;
  Etapa: boolean;
  "Origen de Contacto": boolean;
  Empresa: boolean;
  "Último Contacto": boolean;
  "Fecha de Creación": boolean;
  Notas: boolean;
  Interacciones: boolean;
};

const DEFAULT_VISIBILITY_CLIENTES: ColumnVisibilityClientes = {
  "Nombre Completo": true,
  Teléfono: true,
  Email: false,
  Dirección: false,
  Ciudad: false,
  País: false,
  DNI: false,
  Prioridad: true,
  Etapa: true,
  "Origen de Contacto": true,
  Empresa: true,
  "Último Contacto": true,
  "Fecha de Creación": false,
  Notas: true,
  Interacciones: true,
};

type ColumnVisibilityEmpresas = {
  "Razón Social": boolean;
  "Nombre Fantasía": boolean;
  CUIT: boolean;
  Teléfono: boolean;
  Email: boolean;
  Localidad: boolean;
  Provincia: boolean;
  "Categoría IVA": boolean;
  "Inscripto Ganancias": boolean;
  "Fecha de Creación": boolean;
};

const DEFAULT_VISIBILITY_EMPRESAS: ColumnVisibilityEmpresas = {
  "Razón Social": true,
  "Nombre Fantasía": true,
  CUIT: true,
  Teléfono: true,
  Email: false,
  Localidad: true,
  Provincia: true,
  "Categoría IVA": true,
  "Inscripto Ganancias": true,
  "Fecha de Creación": false,
};

type ColumnVisibilityProveedores = {
  "Razón Social": boolean;
  "Nombre Fantasía": boolean;
  CUIT: boolean;
  Teléfono: boolean;
  Email: boolean;
  Localidad: boolean;
  Provincia: boolean;
  "Categoría IVA": boolean;
  "Vto CAI": boolean;
  "Inscripto Ganancias": boolean;
  "Fecha de Creación": boolean;
};

const DEFAULT_VISIBILITY_PROVEEDORES: ColumnVisibilityProveedores = {
  "Razón Social": true,
  "Nombre Fantasía": true,
  CUIT: true,
  Teléfono: true,
  Email: false,
  Localidad: true,
  Provincia: true,
  "Categoría IVA": true,
  "Vto CAI": true,
  "Inscripto Ganancias": true,
  "Fecha de Creación": false,
};

const LIST_CONFIG: Record<
  ListType,
  { title: string; apiBase: string; exportName: string }
> = {
  clientes: {
    title: "Listado de Clientes",
    apiBase: "/api/clientes",
    exportName: "clientes_crm.csv",
  },
  proveedores: {
    title: "Listado de Proveedores",
    apiBase: "/api/proveedores",
    exportName: "proveedores_crm.csv",
  },
  empresas: {
    title: "Listado de Empresas",
    apiBase: "/api/empresas",
    exportName: "empresas_crm.csv",
  },
};

// -----------------------------
// Página
// -----------------------------
export default function ListadosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ---- Tipo desde URL ----
  const typeFromUrl = (searchParams.get("type") || "clientes") as ListType;
  const safeType: ListType = (["clientes", "proveedores", "empresas"].includes(typeFromUrl)
    ? typeFromUrl
    : "clientes") as ListType;

  const [listType, setListType] = useState<ListType>(safeType);

  // ---- Filtros desde URL ----
  // Clientes: searchTerm, etapa, prioridad
  // Proveedores/Empresas: searchTerm, provincia, categoriaIVA
  const [filters, setFilters] = useState({
    searchTerm: searchParams.get("searchTerm") || "",
    etapa: searchParams.get("etapa") || "",
    prioridad: searchParams.get("prioridad") || "",
    provincia: searchParams.get("provincia") || "",
    categoriaIVA: searchParams.get("categoriaIVA") || "",
  });

  const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

  // ---- Columnas por tipo ----
  const [isClient, setIsClient] = useState(false);

  const [columnVisibilityClientes, setColumnVisibilityClientes] = useState(
    DEFAULT_VISIBILITY_CLIENTES
  );
  const [columnVisibilityEmpresas, setColumnVisibilityEmpresas] = useState(
    DEFAULT_VISIBILITY_EMPRESAS
  );
  const [columnVisibilityProveedores, setColumnVisibilityProveedores] = useState(
    DEFAULT_VISIBILITY_PROVEEDORES
  );

  // ---- Helper URL: set params ----
  const setUrlParams = useCallback(
    (next: Partial<typeof filters> & { type?: ListType }) => {
      const params = new URLSearchParams(searchParams.toString());

      const nextType = next.type ?? listType;
      params.set("type", nextType);

      const apply = (key: keyof typeof filters, value: string) => {
        const v = (value || "").trim();
        if (v) params.set(key, v);
        else params.delete(key);
      };

      apply("searchTerm", next.searchTerm ?? filters.searchTerm);

      // Clientes
      apply("etapa", next.etapa ?? filters.etapa);
      apply("prioridad", next.prioridad ?? filters.prioridad);

      // Proveedores/Empresas
      apply("provincia", next.provincia ?? filters.provincia);
      apply("categoriaIVA", next.categoriaIVA ?? filters.categoriaIVA);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [filters, listType, pathname, router, searchParams]
  );

  // ---- Sync estado desde URL (back/forward / link compartido) ----
  useEffect(() => {
    const urlType = (searchParams.get("type") || "clientes") as ListType;
    const normalizedType: ListType = (["clientes", "proveedores", "empresas"].includes(urlType)
      ? urlType
      : "clientes") as ListType;

    setListType(normalizedType);

    setFilters({
      searchTerm: searchParams.get("searchTerm") || "",
      etapa: searchParams.get("etapa") || "",
      prioridad: searchParams.get("prioridad") || "",
      provincia: searchParams.get("provincia") || "",
      categoriaIVA: searchParams.get("categoriaIVA") || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---- Persistencia de columnas (por tipo) ----
  useEffect(() => {
    setIsClient(true);

    const c = localStorage.getItem("colvis_clientes");
    if (c) setColumnVisibilityClientes((prev) => ({ ...prev, ...JSON.parse(c) }));

    const e = localStorage.getItem("colvis_empresas");
    if (e) setColumnVisibilityEmpresas((prev) => ({ ...prev, ...JSON.parse(e) }));

    const p = localStorage.getItem("colvis_proveedores");
    if (p) setColumnVisibilityProveedores((prev) => ({ ...prev, ...JSON.parse(p) }));
  }, []);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("colvis_clientes", JSON.stringify(columnVisibilityClientes));
  }, [columnVisibilityClientes, isClient]);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("colvis_empresas", JSON.stringify(columnVisibilityEmpresas));
  }, [columnVisibilityEmpresas, isClient]);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem("colvis_proveedores", JSON.stringify(columnVisibilityProveedores));
  }, [columnVisibilityProveedores, isClient]);

  // ---- URL update (búsqueda debounced) ----
  useEffect(() => {
    setUrlParams({ searchTerm: debouncedSearchTerm });
  }, [debouncedSearchTerm, setUrlParams]);

  // ---- URL update (filtros) ----
  useEffect(() => {
    setUrlParams({
      etapa: filters.etapa,
      prioridad: filters.prioridad,
      provincia: filters.provincia,
      categoriaIVA: filters.categoriaIVA,
    });
  }, [filters.etapa, filters.prioridad, filters.provincia, filters.categoriaIVA, setUrlParams]);

  // ---- Queries adicionales (prioridades solo clientes; podés extender a otros) ----
  const { data: prioridadesUnicas } = useQuery<string[]>({
    queryKey: ["prioridades", listType],
    queryFn: async () => {
      if (listType !== "clientes") return [];
      const { data } = await axios.get("/api/clientes/prioridades");
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const prioridadesNormalizadas = useMemo(() => {
    const normalized = (prioridadesUnicas || [])
      .map((p) => formatAndTruncate(p, 50))
      .filter((p) => p && p !== "-");
    return Array.from(new Set(normalized));
  }, [prioridadesUnicas]);

  // ---- Query principal según tipo ----
  const { apiBase, title, exportName } = LIST_CONFIG[listType];

  const queryKey = useMemo(() => {
    if (listType === "clientes") {
      return [listType, debouncedSearchTerm, filters.etapa, filters.prioridad];
    }
    return [listType, debouncedSearchTerm, filters.provincia, filters.categoriaIVA];
  }, [
    listType,
    debouncedSearchTerm,
    filters.etapa,
    filters.prioridad,
    filters.provincia,
    filters.categoriaIVA,
  ]);

  const { data, isLoading, isError, isFetching } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string> = {
        searchTerm: debouncedSearchTerm,
      };

      if (listType === "clientes") {
        if (filters.etapa) params.etapa = filters.etapa;
        if (filters.prioridad) params.prioridad = filters.prioridad;
      } else {
        if (filters.provincia) params.provincia = filters.provincia;
        if (filters.categoriaIVA) params.categoriaIVA = filters.categoriaIVA;
      }

      const res = await axios.get(apiBase, { params });
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  // ---- CSV según tipo (mínimo viable; ajustable) ----
  const csvHeaders = useMemo(() => {
    if (listType === "clientes") {
      return [
        { label: "Nombre Completo", key: "nombreCompleto" },
        { label: "Teléfono", key: "telefono" },
        { label: "Email", key: "email" },
        { label: "Empresa", key: "empresaNombre" },
        { label: "Prioridad", key: "prioridad" },
        { label: "Etapa", key: "etapa" },
        { label: "Origen", key: "origenContacto" },
      ];
    }

    if (listType === "proveedores") {
      return [
        { label: "CUIT", key: "cuit" },
        { label: "Razón Social", key: "razonSocial" },
        { label: "Nombre Fantasía", key: "nombreFantasia" },
        { label: "Teléfono", key: "telefono" },
        { label: "Email", key: "email" },
        { label: "Provincia", key: "provincia" },
        { label: "Categoría IVA", key: "categoriaIVA" },
        { label: "Vto CAI", key: "fechaVtoCAI" },
      ];
    }

    return [
      { label: "CUIT", key: "cuit" },
      { label: "Razón Social", key: "razonSocial" },
      { label: "Nombre Fantasía", key: "nombreFantasia" },
      { label: "Teléfono", key: "telefono" },
      { label: "Email", key: "email" },
      { label: "Provincia", key: "provincia" },
      { label: "Categoría IVA", key: "categoriaIVA" },
      { label: "Ganancias", key: "inscriptoGanancias" },
    ];
  }, [listType]);

  const csvData = data || [];

  // ---- Handlers ----
  const handleTypeChange = (nextType: ListType) => {
    setListType(nextType);
    setUrlParams({ type: nextType });
  };

  const handleFilterChange = (name: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    // URL se actualiza por los useEffect
  };

  const toggleColumn = (column: string) => {
    if (listType === "clientes") {
      setColumnVisibilityClientes((prev) => ({
        ...prev,
        [column]: !prev[column as keyof ColumnVisibilityClientes],
      }));
      return;
    }
    if (listType === "proveedores") {
      setColumnVisibilityProveedores((prev) => ({
        ...prev,
        [column]: !prev[column as keyof ColumnVisibilityProveedores],
      }));
      return;
    }
    setColumnVisibilityEmpresas((prev) => ({
      ...prev,
      [column]: !prev[column as keyof ColumnVisibilityEmpresas],
    }));
  };

  const orderedColumns = useMemo(() => {
    if (listType === "clientes") {
      return Object.keys(DEFAULT_VISIBILITY_CLIENTES) as (keyof ColumnVisibilityClientes)[];
    }
    if (listType === "proveedores") {
      return Object.keys(DEFAULT_VISIBILITY_PROVEEDORES) as (keyof ColumnVisibilityProveedores)[];
    }
    return Object.keys(DEFAULT_VISIBILITY_EMPRESAS) as (keyof ColumnVisibilityEmpresas)[];
  }, [listType]);

  const currentVisibility = useMemo(() => {
    if (listType === "clientes") return columnVisibilityClientes;
    if (listType === "proveedores") return columnVisibilityProveedores;
    return columnVisibilityEmpresas;
  }, [listType, columnVisibilityClientes, columnVisibilityProveedores, columnVisibilityEmpresas]);

  if (isLoading) return <div className="p-10 text-center">Cargando...</div>;
  if (isError)
    return <div className="p-10 text-center text-red-600">Error al cargar.</div>;

  return (
    <div className="mx-auto py-4 px-4 md:px-4">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 border-b mb-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold">{title}</h1>

          {/* Switch 3 estados */}
          <Tabs value={listType} onValueChange={(v) => handleTypeChange(v as ListType)}>
            <TabsList>
              <TabsTrigger value="clientes">Clientes</TabsTrigger>
              <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
              <TabsTrigger value="empresas">Empresas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2 flex-wrap pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Ver Columnas</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mostrar/Ocultar Columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {orderedColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={String(column)}
                  checked={Boolean((currentVisibility as any)[column])}
                  onCheckedChange={() => toggleColumn(String(column))}
                  onSelect={(e) => e.preventDefault()}
                >
                  {String(column)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isClient && (
            <Button variant="outline" asChild>
              <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={exportName}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </CSVLink>
            </Button>
          )}

          {/* Acciones específicas por tipo (mínimo viable) */}
          {listType === "clientes" && (
            <>
              <ImportClientsDialog />
              <AddClientDialog prioridadesOptions={prioridadesNormalizadas} />
            </>
          )}

          {listType === "proveedores" && <AddProveedorDialog />}
          {listType === "empresas" && <AddEmpresaDialog />}
        </div>

        {/* Mobile actions */}
        <div className="flex md:hidden items-center gap-2 flex-wrap pb-4">
          {listType === "clientes" && (
            <AddClientDialog prioridadesOptions={prioridadesNormalizadas} />
          )}
        </div>
      </div>

      {/* Filtros:
          Reuso tu ClientFilters solo para clientes.
          Para proveedores/empresas, muestro filtros simples inline (provincia / categoriaIVA). */}
      {listType === "clientes" ? (
        <ClientFilters
          filters={{
            searchTerm: filters.searchTerm,
            etapa: filters.etapa,
            prioridad: filters.prioridad,
          }}
          onFilterChange={(name, value) =>
            handleFilterChange(name as "searchTerm" | "etapa" | "prioridad", value)
          }
          prioridadesUnicas={prioridadesNormalizadas}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-3 mt-3">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Buscar</label>
            <input
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              placeholder="CUIT, razón social, email..."
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Provincia</label>
            <input
              value={filters.provincia}
              onChange={(e) => handleFilterChange("provincia", e.target.value)}
              placeholder="Ej: Buenos Aires"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Categoría IVA</label>
            <input
              value={filters.categoriaIVA}
              onChange={(e) => handleFilterChange("categoriaIVA", e.target.value)}
              placeholder="Ej: Responsable Inscripto"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div
        className={cn(
          "border rounded-md transition-opacity duration-300 hidden md:block border rounded-md mt-4",
          isFetching ? "opacity-50" : "opacity-100"
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {/* CLIENTES */}
              {listType === "clientes" && (
                <>
                  {(columnVisibilityClientes["Nombre Completo"] as boolean) && (
                    <TableHead className="text-left">Nombre Completo</TableHead>
                  )}
                  {(columnVisibilityClientes["Teléfono"] as boolean) && (
                    <TableHead className="text-center">Teléfono</TableHead>
                  )}
                  {(columnVisibilityClientes["Email"] as boolean) && (
                    <TableHead className="text-center">Email</TableHead>
                  )}
                  {(columnVisibilityClientes["DNI"] as boolean) && (
                    <TableHead className="text-center">DNI</TableHead>
                  )}
                  {(columnVisibilityClientes["Dirección"] as boolean) && (
                    <TableHead className="text-center">Dirección</TableHead>
                  )}
                  {(columnVisibilityClientes["Ciudad"] as boolean) && (
                    <TableHead className="text-center">Ciudad</TableHead>
                  )}
                  {(columnVisibilityClientes["País"] as boolean) && (
                    <TableHead className="text-center">País</TableHead>
                  )}
                  {(columnVisibilityClientes["Prioridad"] as boolean) && (
                    <TableHead className="text-center">Prioridad</TableHead>
                  )}
                  {(columnVisibilityClientes["Etapa"] as boolean) && (
                    <TableHead className="text-center">Etapa</TableHead>
                  )}
                  {(columnVisibilityClientes["Origen de Contacto"] as boolean) && (
                    <TableHead className="text-center">Origen</TableHead>
                  )}
                  {(columnVisibilityClientes["Empresa"] as boolean) && (
                    <TableHead className="text-center">Empresa</TableHead>
                  )}
                  {(columnVisibilityClientes["Último Contacto"] as boolean) && (
                    <TableHead className="text-center">Último Contacto</TableHead>
                  )}
                  {(columnVisibilityClientes["Fecha de Creación"] as boolean) && (
                    <TableHead className="text-center">Fecha de Creación</TableHead>
                  )}
                  {(columnVisibilityClientes["Notas"] as boolean) && (
                    <TableHead className="text-center">Notas</TableHead>
                  )}
                  {(columnVisibilityClientes["Interacciones"] as boolean) && (
                    <TableHead className="text-center">Interacciones</TableHead>
                  )}
                  <TableHead className="text-center">Acciones</TableHead>
                </>
              )}

              {/* PROVEEDORES */}
              {listType === "proveedores" && (
                <>
                  {columnVisibilityProveedores["Razón Social"] && (
                    <TableHead className="text-left">Razón Social</TableHead>
                  )}
                  {columnVisibilityProveedores["Nombre Fantasía"] && (
                    <TableHead className="text-left">Nombre Fantasía</TableHead>
                  )}
                  {columnVisibilityProveedores["CUIT"] && (
                    <TableHead className="text-center">CUIT</TableHead>
                  )}
                  {columnVisibilityProveedores["Teléfono"] && (
                    <TableHead className="text-center">Teléfono</TableHead>
                  )}
                  {columnVisibilityProveedores["Email"] && (
                    <TableHead className="text-center">Email</TableHead>
                  )}
                  {columnVisibilityProveedores["Localidad"] && (
                    <TableHead className="text-center">Localidad</TableHead>
                  )}
                  {columnVisibilityProveedores["Provincia"] && (
                    <TableHead className="text-center">Provincia</TableHead>
                  )}
                  {columnVisibilityProveedores["Categoría IVA"] && (
                    <TableHead className="text-center">Categoría IVA</TableHead>
                  )}
                  {columnVisibilityProveedores["Vto CAI"] && (
                    <TableHead className="text-center">Vto CAI</TableHead>
                  )}
                  {columnVisibilityProveedores["Inscripto Ganancias"] && (
                    <TableHead className="text-center">Ganancias</TableHead>
                  )}
                  {columnVisibilityProveedores["Fecha de Creación"] && (
                    <TableHead className="text-center">Creación</TableHead>
                  )}
                </>
              )}

              {/* EMPRESAS */}
              {listType === "empresas" && (
                <>
                  {columnVisibilityEmpresas["Razón Social"] && (
                    <TableHead className="text-left">Razón Social</TableHead>
                  )}
                  {columnVisibilityEmpresas["Nombre Fantasía"] && (
                    <TableHead className="text-left">Nombre Fantasía</TableHead>
                  )}
                  {columnVisibilityEmpresas["CUIT"] && (
                    <TableHead className="text-center">CUIT</TableHead>
                  )}
                  {columnVisibilityEmpresas["Teléfono"] && (
                    <TableHead className="text-center">Teléfono</TableHead>
                  )}
                  {columnVisibilityEmpresas["Email"] && (
                    <TableHead className="text-center">Email</TableHead>
                  )}
                  {columnVisibilityEmpresas["Localidad"] && (
                    <TableHead className="text-center">Localidad</TableHead>
                  )}
                  {columnVisibilityEmpresas["Provincia"] && (
                    <TableHead className="text-center">Provincia</TableHead>
                  )}
                  {columnVisibilityEmpresas["Categoría IVA"] && (
                    <TableHead className="text-center">Categoría IVA</TableHead>
                  )}
                  {columnVisibilityEmpresas["Inscripto Ganancias"] && (
                    <TableHead className="text-center">Ganancias</TableHead>
                  )}
                  {columnVisibilityEmpresas["Fecha de Creación"] && (
                    <TableHead className="text-center">Creación</TableHead>
                  )}
                </>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* CLIENTES */}
            {listType === "clientes" &&
              (data as Client[])?.map((cliente) => (
                <TableRow key={cliente._id}>
                  {columnVisibilityClientes["Nombre Completo"] && (
                    <TableCell className="font-medium text-left">
                      <Link
                        href={`/dashboard/listados/${cliente._id}`}
                        className="hover:underline"
                      >
                        {formatAndTruncate(cliente.nombreCompleto, 25)}
                      </Link>
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Teléfono"] && (
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 group">
                        <span>{cliente.telefono}</span>
                        <div className="group-hover:opacity-100 transition-opacity">
                          <WhatsAppButton telefono={cliente.telefono} />
                        </div>
                      </div>
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Email"] && (
                    <TableCell className="text-center">
                      {cliente.email ? (
                        <div className="flex items-center justify-center gap-2 group">
                          <span>{cliente.email}</span>
                          <div className="group-hover:opacity-100 transition-opacity">
                            <EmailButton email={cliente.email} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["DNI"] && (
                    <TableCell className="text-center">{(cliente as any).dni || "-"}</TableCell>
                  )}

                  {columnVisibilityClientes["Dirección"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate((cliente as any).direccion, 30)}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Ciudad"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate((cliente as any).ciudad, 20)}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["País"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate((cliente as any).pais, 20)}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Prioridad"] && (
                    <TableCell className="text-center">
                      {(cliente as any).prioridad
                        ? formatAndTruncate((cliente as any).prioridad, 20)
                        : "-"}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Etapa"] && (
                    <TableCell className="text-center">
                      {(cliente as any).etapa
                        ? formatAndTruncate((cliente as any).etapa, 30)
                        : "-"}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Origen de Contacto"] && (
                    <TableCell className="text-center">
                      {(cliente as any).origenContacto || "-"}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Empresa"] && (
                    <TableCell>
                      <div className="flex items-center text-center justify-center">
                        {(cliente as any).empresaNombre || (cliente as any).empresa || "Sin Asignar"}
                        <CompanyDataPopover client={cliente as any} />
                      </div>
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Último Contacto"] && (
                    <TableCell className="text-center">
                      {(cliente as any).ultimoContacto
                        ? format(new Date((cliente as any).ultimoContacto), "dd MMM yyyy", {
                            locale: es,
                          })
                        : "Sin Contactar"}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Fecha de Creación"] && (
                    <TableCell className="text-center">
                      {format(new Date((cliente as any).createdAt), "dd MMM yyyy", {
                        locale: es,
                      })}
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Notas"] && (
                    <TableCell className="text-center">
                      <TableCellActions client={cliente as any} actionType="notas" />
                    </TableCell>
                  )}

                  {columnVisibilityClientes["Interacciones"] && (
                    <TableCell className="text-center">
                      <TableCellActions client={cliente as any} actionType="interacciones" />
                    </TableCell>
                  )}

                  <TableCell className="text-center">
                    <ClientActions
                      client={cliente as any}
                      prioridadesOptions={prioridadesNormalizadas}
                    />
                  </TableCell>
                </TableRow>
              ))}

            {/* PROVEEDORES */}
            {listType === "proveedores" &&
              (data || []).map((p: any) => (
                <TableRow key={p._id}>
                  {columnVisibilityProveedores["Razón Social"] && (
                    <TableCell className="font-medium text-left">
                      {formatAndTruncate(p.razonSocial, 30)}
                    </TableCell>
                  )}
                  {columnVisibilityProveedores["Nombre Fantasía"] && (
                    <TableCell className="text-left">
                      {formatAndTruncate(p.nombreFantasia, 30)}
                    </TableCell>
                  )}
                  {columnVisibilityProveedores["CUIT"] && (
                    <TableCell className="text-center">{p.cuit || "-"}</TableCell>
                  )}
                  {columnVisibilityProveedores["Teléfono"] && (
                    <TableCell className="text-center">{p.telefono || "-"}</TableCell>
                  )}
                  {columnVisibilityProveedores["Email"] && (
                    <TableCell className="text-center">{p.email || "-"}</TableCell>
                  )}
                  {columnVisibilityProveedores["Localidad"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate(p.localidad, 20)}
                    </TableCell>
                  )}
                  {columnVisibilityProveedores["Provincia"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate(p.provincia, 20)}
                    </TableCell>
                  )}
                  {columnVisibilityProveedores["Categoría IVA"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate(p.categoriaIVA, 25)}
                    </TableCell>
                  )}
                  {columnVisibilityProveedores["Vto CAI"] && (
                    <TableCell className="text-center">
                      {p.fechaVtoCAI ? format(new Date(p.fechaVtoCAI), "dd MMM yyyy", { locale: es }) : "-"}
                    </TableCell>
                  )}
                  {columnVisibilityProveedores["Inscripto Ganancias"] && (
                    <TableCell className="text-center">
                      {typeof p.inscriptoGanancias === "boolean" ? (p.inscriptoGanancias ? "Sí" : "No") : "-"}
                    </TableCell>
                  )}
                  {columnVisibilityProveedores["Fecha de Creación"] && (
                    <TableCell className="text-center">
                      {p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy", { locale: es }) : "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))}

            {/* EMPRESAS */}
            {listType === "empresas" &&
              (data || []).map((e: any) => (
                <TableRow key={e._id}>
                  {columnVisibilityEmpresas["Razón Social"] && (
                    <TableCell className="font-medium text-left">
                      {formatAndTruncate(e.razonSocial, 30)}
                    </TableCell>
                  )}
                  {columnVisibilityEmpresas["Nombre Fantasía"] && (
                    <TableCell className="text-left">
                      {formatAndTruncate(e.nombreFantasia, 30)}
                    </TableCell>
                  )}
                  {columnVisibilityEmpresas["CUIT"] && (
                    <TableCell className="text-center">{e.cuit || "-"}</TableCell>
                  )}
                  {columnVisibilityEmpresas["Teléfono"] && (
                    <TableCell className="text-center">{e.telefono || "-"}</TableCell>
                  )}
                  {columnVisibilityEmpresas["Email"] && (
                    <TableCell className="text-center">{e.email || "-"}</TableCell>
                  )}
                  {columnVisibilityEmpresas["Localidad"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate(e.localidad, 20)}
                    </TableCell>
                  )}
                  {columnVisibilityEmpresas["Provincia"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate(e.provincia, 20)}
                    </TableCell>
                  )}
                  {columnVisibilityEmpresas["Categoría IVA"] && (
                    <TableCell className="text-center">
                      {formatAndTruncate(e.categoriaIVA, 25)}
                    </TableCell>
                  )}
                  {columnVisibilityEmpresas["Inscripto Ganancias"] && (
                    <TableCell className="text-center">
                      {typeof e.inscriptoGanancias === "boolean" ? (e.inscriptoGanancias ? "Sí" : "No") : "-"}
                    </TableCell>
                  )}
                  {columnVisibilityEmpresas["Fecha de Creación"] && (
                    <TableCell className="text-center">
                      {e.createdAt ? format(new Date(e.createdAt), "dd MMM yyyy", { locale: es }) : "-"}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile list: dejo clientes como ya lo tenías; proveedores/empresas lo podés extender luego */}
      <div className="md:hidden mt-4">
        {isLoading && (
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {listType === "clientes" &&
          (data as Client[])?.map((cliente) => (
            <ClientMobileCard
              key={cliente._id}
              client={cliente as any}
              prioridadesOptions={prioridadesNormalizadas}
            />
          ))}

        {listType !== "clientes" &&
          (data || []).map((row: any) => (
            <div key={row._id} className="border rounded-md p-3 mb-3">
              <div className="font-medium">
                {formatAndTruncate(row.razonSocial || row.nombreCompleto, 40)}
              </div>
              <div className="text-sm text-muted-foreground">
                {row.cuit ? `CUIT: ${row.cuit}` : row.email || "-"}
              </div>
            </div>
          ))}

        {!isLoading && (data?.length || 0) === 0 && (
          <div className="text-center text-muted-foreground py-10">
            No se encontraron resultados.
          </div>
        )}
      </div>
    </div>
  );
}