"use client";

import Link from "next/link";
import axios from "axios";
import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { DataTablePro } from "@/components/stock/DataTablePro";
import { ExportCsvButton } from "@/components/stock/ExportCsvButton";
import { FilterChipsBar, type Chip } from "@/components/stock/FilterChipsBar";

type Item = {
  _id: string;
  sku: string;
  name: string;
  type: string;
  uom: string;
  category: string;
  isActive: boolean;
  createdAt: string;
};

type TypeFilter = "all" | "RAW" | "COMPONENT" | "FINISHED";
type ActiveFilter = "all" | "true" | "false";

function typeLabel(t: string) {
  const map: Record<string, string> = {
    RAW: "Materia prima",
    COMPONENT: "Componente",
    FINISHED: "Producto terminado",
  };
  return map[t] ?? t;
}

function typeBadge(t: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    FINISHED: { label: "Producto terminado", variant: "default" },
    COMPONENT: { label: "Componente", variant: "secondary" },
    RAW: { label: "Materia prima", variant: "outline" },
  };
  return map[t] ?? { label: t, variant: "outline" };
}

function isTypeFilter(v: string): v is TypeFilter {
  return v === "all" || v === "RAW" || v === "COMPONENT" || v === "FINISHED";
}

function isActiveFilter(v: string): v is ActiveFilter {
  return v === "all" || v === "true" || v === "false";
}

export default function StockItemsPage() {
  const [type, setType] = useState<TypeFilter>("all");
  const [active, setActive] = useState<ActiveFilter>("all");

  const queryKey = useMemo(() => ["itemsList", type, active], [type, active]);

  const { data, isFetching } = useQuery<Item[]>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string | boolean> = {};
      if (type !== "all") params.type = type;
      if (active !== "all") params.active = active === "true";

      const { data } = await axios.get("/api/items", { params });
      return data.data as Item[];
    },
    placeholderData: keepPreviousData,
  });

  const rows = data ?? [];

  const chips = useMemo<Chip[]>(() => {
    const arr: Chip[] = [];

    if (type !== "all") {
      arr.push({
        key: "type",
        label: "Tipo",
        value: typeLabel(type),
        onRemove: () => setType("all"),
      });
    }

    if (active !== "all") {
      arr.push({
        key: "active",
        label: "Estado",
        value: active === "true" ? "Activos" : "Inactivos",
        onRemove: () => setActive("all"),
      });
    }

    return arr;
  }, [type, active]);

  const columns = useMemo<ColumnDef<Item>[]>(() => {
    return [
      {
        id: "sku",
        header: "SKU",
        accessorFn: (r) => r.sku,
        cell: ({ row }) => {
          const b = typeBadge(row.original.type);
          return (
            <div className="space-y-1 min-w-[180px]">
              <Link href={`/dashboard/stock/items/${row.original._id}`} className="font-medium hover:underline">
                {row.original.sku}
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant={b.variant} className="whitespace-nowrap">
                  {b.label}
                </Badge>
                {!row.original.isActive ? <span className="text-xs text-muted-foreground">Inactivo</span> : null}
              </div>
            </div>
          );
        },
      },
      {
        id: "name",
        header: "Descripción",
        accessorFn: (r) => `${r.name} ${r.category}`,
        cell: ({ row }) => (
          <div className="min-w-[320px]">
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.category || <span className="text-muted-foreground">Sin categoría</span>}
            </div>
          </div>
        ),
      },
      {
        id: "uom",
        header: "UOM",
        accessorFn: (r) => r.uom,
        cell: ({ row }) => <span className="font-medium">{row.original.uom}</span>,
      },
      {
        id: "isActive",
        header: "Estado",
        accessorFn: (r) => (r.isActive ? "Activo" : "Inactivo"),
        cell: ({ row }) =>
          row.original.isActive ? <Badge variant="secondary">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>,
      },
      {
        id: "createdAt",
        header: "Creado",
        accessorFn: (r) => r.createdAt,
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground tabular-nums">
            {new Date(row.original.createdAt).toLocaleDateString("es-AR")}
          </div>
        ),
      },
    ];
  }, []);

  const exportCols = useMemo(
    () => [
      { header: "SKU", value: (r: Item) => r.sku },
      { header: "Nombre", value: (r: Item) => r.name },
      { header: "Categoría", value: (r: Item) => r.category },
      { header: "Tipo", value: (r: Item) => r.type },
      { header: "UOM", value: (r: Item) => r.uom },
      { header: "Activo", value: (r: Item) => (r.isActive ? "true" : "false") },
      { header: "Creado", value: (r: Item) => r.createdAt },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <StockPageHeader
        title="Items (SKU)"
        description="Catálogo de ítems de stock: productos terminados, componentes y materias primas."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock", href: "/dashboard/stock/balances" },
          { label: "Items (SKU)" },
        ]}
      />

      <Card>
        <CardContent className="p-4 space-y-3">
          <FilterChipsBar
            chips={chips}
            onClearAll={() => {
              setType("all");
              setActive("all");
            }}
          />

          <DataTablePro
            columns={columns}
            data={rows}
            isLoading={isFetching}
            searchPlaceholder="Buscar por SKU, nombre, categoría..."
            emptyTitle="Sin items"
            emptyDesc="No hay items que coincidan con los filtros actuales."
            toolbarLeft={
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">Tipo</div>
                  <Select
                    value={type}
                    onValueChange={(v) => {
                      if (isTypeFilter(v)) setType(v);
                    }}
                  >
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="RAW">Materia prima (RAW)</SelectItem>
                      <SelectItem value="COMPONENT">Componente (COMPONENT)</SelectItem>
                      <SelectItem value="FINISHED">Producto terminado (FINISHED)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">Estado</div>
                  <Select
                    value={active}
                    onValueChange={(v) => {
                      if (isActiveFilter(v)) setActive(v);
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="true">Activos</SelectItem>
                      <SelectItem value="false">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-muted-foreground flex items-center min-w-[120px]">
                  {isFetching ? "Actualizando..." : rows.length ? `${rows.length} items` : ""}
                </div>
              </div>
            }
            toolbarRight={<ExportCsvButton filename={`items_${type}_${active}.csv`} rows={rows} columns={exportCols} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
