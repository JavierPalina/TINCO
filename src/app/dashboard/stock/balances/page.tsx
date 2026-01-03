// app/dashboard/stock/balances/page.tsx

"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { StockKpis } from "@/components/stock/StockKpis";
import { DataTablePro } from "@/components/stock/DataTablePro";
import { ExportCsvButton } from "@/components/stock/ExportCsvButton";
import { FilterChipsBar } from "@/components/stock/FilterChipsBar";

import { MovementDialog } from "@/components/stock/MovementDialog";
import { ReserveDialog } from "@/components/stock/ReserveDialog";
import { BalanceRowActions } from "@/components/stock/BalanceRowActions";

type Warehouse = { _id: string; name: string };

type BalanceRow = {
  _id: string;
  item: { _id: string; sku: string; name: string; category: string; uom: string; type?: string };
  warehouse: { _id: string; name: string };
  location?: { _id: string; code: string } | null;
  onHand: number;
  reserved: number;
  available: number;
  updatedAt: string;
};

export default function StockBalancesPage() {
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [onlyLow, setOnlyLow] = useState<"all" | "low">("all"); // low = available <= 0

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => (await axios.get("/api/warehouses")).data.data,
  });

  const queryKey = useMemo(() => ["stockBalances", warehouseId], [warehouseId]);

  const { data, isFetching } = useQuery<BalanceRow[]>({
    queryKey,
    queryFn: async () => {
      const params: any = {};
      if (warehouseId !== "all") params.warehouseId = warehouseId;
      const { data } = await axios.get("/api/stock/balances", { params });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });

  const baseRows = data ?? [];

  const rows = useMemo(() => {
    if (onlyLow === "low") return baseRows.filter((r) => r.available <= 0);
    return baseRows;
  }, [baseRows, onlyLow]);

  const totals = useMemo(() => {
    const skuSet = new Set<string>();
    let onHand = 0;
    let reserved = 0;
    let available = 0;
    for (const r of rows) {
      skuSet.add(r.item._id);
      onHand += r.onHand;
      reserved += r.reserved;
      available += r.available;
    }
    return { totalSkus: skuSet.size, onHand, reserved, available };
  }, [rows]);

  const chips = useMemo(() => {
    const arr = [];
    if (warehouseId !== "all") {
      const name = warehouses?.find((w) => w._id === warehouseId)?.name ?? warehouseId;
      arr.push({
        key: "warehouse",
        label: "Depósito",
        value: name,
        onRemove: () => setWarehouseId("all"),
      });
    }
    if (onlyLow === "low") {
      arr.push({
        key: "low",
        label: "Estado",
        value: "Sólo faltantes",
        onRemove: () => setOnlyLow("all"),
      });
    }
    return arr;
  }, [warehouseId, onlyLow, warehouses]);

  const columns = useMemo<ColumnDef<BalanceRow>[]>(() => {
    return [
      {
        id: "sku",
        header: "SKU",
        accessorFn: (r) => r.item.sku,
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium">{row.original.item.sku}</div>
            {row.original.item.type ? (
              <div className="text-xs text-muted-foreground">{row.original.item.type}</div>
            ) : null}
          </div>
        ),
      },
      {
        id: "item",
        header: "Item",
        accessorFn: (r) => r.item.name,
        cell: ({ row }) => (
          <div className="min-w-[280px]">
            <div className="font-medium">{row.original.item.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.item.category} · {row.original.item.uom}
            </div>
          </div>
        ),
      },
      {
        id: "warehouse",
        header: "Depósito",
        accessorFn: (r) => r.warehouse.name,
      },
      {
        id: "location",
        header: "Ubicación",
        accessorFn: (r) => r.location?.code ?? "-",
        cell: ({ row }) => row.original.location?.code ?? <span className="text-muted-foreground">-</span>,
      },
      {
        id: "status",
        header: "Estado",
        accessorFn: (r) => (r.available <= 0 ? "Faltante" : "OK"),
        cell: ({ row }) =>
          row.original.available <= 0 ? (
            <Badge variant="destructive">Faltante</Badge>
          ) : (
            <Badge variant="secondary">OK</Badge>
          ),
      },
      {
        id: "onHand",
        header: () => <div className="text-right">Físico</div>,
        accessorFn: (r) => r.onHand,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.onHand}</div>,
      },
      {
        id: "reserved",
        header: () => <div className="text-right">Reservado</div>,
        accessorFn: (r) => r.reserved,
        cell: ({ row }) => <div className="text-right tabular-nums">{row.original.reserved}</div>,
      },
      {
        id: "available",
        header: () => <div className="text-right">Disponible</div>,
        accessorFn: (r) => r.available,
        cell: ({ row }) => (
          <div className="text-right tabular-nums font-semibold">
            {row.original.available}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <BalanceRowActions itemId={row.original.item._id} warehouseId={row.original.warehouse._id} />
          </div>
        ),
      },
    ];
  }, []);

  const exportCols = useMemo(
    () => [
      { header: "SKU", value: (r: BalanceRow) => r.item.sku },
      { header: "Item", value: (r: BalanceRow) => r.item.name },
      { header: "Categoría", value: (r: BalanceRow) => r.item.category },
      { header: "UOM", value: (r: BalanceRow) => r.item.uom },
      { header: "Depósito", value: (r: BalanceRow) => r.warehouse.name },
      { header: "Ubicación", value: (r: BalanceRow) => r.location?.code ?? "" },
      { header: "Físico", value: (r: BalanceRow) => r.onHand },
      { header: "Reservado", value: (r: BalanceRow) => r.reserved },
      { header: "Disponible", value: (r: BalanceRow) => r.available },
      { header: "Actualizado", value: (r: BalanceRow) => r.updatedAt },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <StockPageHeader
        title="Balances"
        description="Operación por SKU y depósito. Disponible = Físico - Reservado."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Stock", href: "/dashboard/stock/balances" }, { label: "Balances" }]}
        actions={
          <div className="flex gap-2">
            <ReserveDialog />
            <MovementDialog />
          </div>
        }
      />

      <StockKpis
        totalSkus={totals.totalSkus}
        totalOnHand={totals.onHand}
        totalReserved={totals.reserved}
        totalAvailable={totals.available}
      />

      <Card>
        <CardContent className="p-4 space-y-3">
          <FilterChipsBar
            chips={chips}
            onClearAll={() => {
              setWarehouseId("all");
              setOnlyLow("all");
            }}
          />

          <DataTablePro
            columns={columns}
            data={rows}
            isLoading={isFetching}
            searchPlaceholder="Buscar por SKU, nombre, categoría, depósito..."
            emptyTitle="Sin balances"
            emptyDesc="No hay movimientos registrados o los filtros no arrojan resultados."
            toolbarLeft={
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Depósito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los depósitos</SelectItem>
                    {(warehouses ?? []).map((w) => (
                      <SelectItem key={w._id} value={w._id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={onlyLow} onValueChange={(v) => setOnlyLow(v as any)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="low">Sólo faltantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            toolbarRight={
              <ExportCsvButton
                filename={`balances_${warehouseId}_${onlyLow}.csv`}
                rows={rows}
                columns={exportCols}
              />
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
