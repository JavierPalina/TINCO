// app/dashboard/stock/movements/page.tsx
"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { FilterChipsBar } from "@/components/stock/FilterChipsBar";
import { DataTable } from "@/components/stock/DataTable";
import { MovementDialog } from "@/components/stock/MovementDialog";
import { ReserveDialog } from "@/components/stock/ReserveDialog";
import { ProduceDialog } from "@/components/stock/ProduceDialog";

type Warehouse = { _id: string; name: string };

type Movement = {
  _id: string;
  type: string;
  itemId?: { sku: string; name: string };
  warehouseId?: { name: string };
  qty: number;
  uom: string;
  note?: string;
  createdAt: string;
  ref?: { kind?: string; id?: string };
  fromWarehouseId?: { name?: string };
  toWarehouseId?: { name?: string };
};

type MovementTypeFilter =
  | "all"
  | "IN"
  | "OUT"
  | "ADJUST"
  | "TRANSFER"
  | "RESERVE"
  | "UNRESERVE"
  | "PRODUCE";

function typeBadge(type: string) {
  const map: Record<
    string,
    { label: string; helper?: string; variant: "default" | "secondary" | "outline" | "destructive" }
  > = {
    IN: { label: "Ingreso", helper: "IN", variant: "default" },
    OUT: { label: "Egreso", helper: "OUT", variant: "destructive" },
    ADJUST: { label: "Ajuste", helper: "ADJUST", variant: "secondary" },
    TRANSFER: { label: "Transferencia", helper: "TRANSFER", variant: "outline" },
    RESERVE: { label: "Reserva", helper: "RESERVE", variant: "secondary" },
    UNRESERVE: { label: "Libera reserva", helper: "UNRESERVE", variant: "outline" },
    PRODUCE: { label: "Producción", helper: "PRODUCE", variant: "default" },
  };
  return map[type] ?? { label: type, variant: "outline" as const };
}

function formatDateTimeAR(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-AR"),
    time: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function isMovementTypeFilter(v: string): v is MovementTypeFilter {
  return (
    v === "all" ||
    v === "IN" ||
    v === "OUT" ||
    v === "ADJUST" ||
    v === "TRANSFER" ||
    v === "RESERVE" ||
    v === "UNRESERVE" ||
    v === "PRODUCE"
  );
}

export default function StockMovementsPage() {
  const [warehouseId, setWarehouseId] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<MovementTypeFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => (await axios.get("/api/warehouses")).data.data,
  });

  const queryKey = useMemo(() => ["movements", warehouseId], [warehouseId]);

  const { data, isFetching } = useQuery<Movement[]>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string | boolean> = {};
      if (warehouseId !== "all") params.warehouseId = warehouseId;

      const { data } = await axios.get("/api/stock/movements", { params });
      return data.data as Movement[];
    },
    placeholderData: keepPreviousData,
  });

  const baseRows = data ?? [];

  const rows = useMemo(() => {
    let result = baseRows;
    if (typeFilter !== "all") result = result.filter((r) => r.type === typeFilter);
    if (dateFrom) result = result.filter((r) => new Date(r.createdAt) >= new Date(dateFrom));
    if (dateTo) result = result.filter((r) => new Date(r.createdAt) <= new Date(dateTo + "T23:59:59"));
    return result;
  }, [baseRows, typeFilter, dateFrom, dateTo]);

  const chips = useMemo(() => {
    const arr: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    if (warehouseId !== "all") {
      const name = warehouses?.find((w) => w._id === warehouseId)?.name ?? warehouseId;
      arr.push({
        key: "warehouse",
        label: "Depósito",
        value: name,
        onRemove: () => setWarehouseId("all"),
      });
    }

    if (typeFilter !== "all") {
      const b = typeBadge(typeFilter);
      arr.push({
        key: "type",
        label: "Tipo",
        value: b.helper ? `${b.label} (${b.helper})` : b.label,
        onRemove: () => setTypeFilter("all"),
      });
    }

    return arr;
  }, [warehouseId, warehouses, typeFilter]);

  const columns = useMemo<ColumnDef<Movement>[]>(() => {
    return [
      {
        id: "createdAt",
        header: "Fecha",
        accessorFn: (r) => r.createdAt,
        cell: ({ row }) => {
          const { date, time } = formatDateTimeAR(row.original.createdAt);
          return (
            <div className="text-sm">
              <div className="font-medium">{date}</div>
              <div className="text-xs text-muted-foreground">{time}</div>
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Tipo",
        accessorFn: (r) => r.type,
        cell: ({ row }) => {
          const b = typeBadge(row.original.type);
          return (
            <div className="space-y-1">
              <Badge variant={b.variant}>{b.label}</Badge>
              {b.helper ? <div className="text-[11px] text-muted-foreground">{b.helper}</div> : null}
            </div>
          );
        },
      },
      {
        id: "item",
        header: "Item",
        accessorFn: (r) => `${r.itemId?.sku ?? ""} ${r.itemId?.name ?? ""}`.trim(),
        cell: ({ row }) => (
          <div className="min-w-[280px]">
            <div className="font-medium">{row.original.itemId?.sku ?? "-"}</div>
            <div className="text-xs text-muted-foreground">{row.original.itemId?.name ?? "-"}</div>
          </div>
        ),
      },
      {
        id: "warehouse",
        header: "Depósito",
        accessorFn: (r) => r.warehouseId?.name ?? "",
        cell: ({ row }) => {
          const t = row.original.type;
          const main = row.original.warehouseId?.name ?? "-";

          if (t === "TRANSFER") {
            const from = row.original.fromWarehouseId?.name ?? "Origen";
            const to = row.original.toWarehouseId?.name ?? "Destino";
            return (
              <div className="text-sm">
                <div className="font-medium">
                  {from} <span className="text-muted-foreground">→</span> {to}
                </div>
                <div className="text-xs text-muted-foreground">Transferencia entre depósitos</div>
              </div>
            );
          }

          return (
            <div className="text-sm">
              <div className="font-medium">{main}</div>
              <div className="text-xs text-muted-foreground">Impacto en este depósito</div>
            </div>
          );
        },
      },
      {
        id: "qty",
        header: () => <div className="text-right">Cantidad</div>,
        accessorFn: (r) => r.qty,
        cell: ({ row }) => (
          <div className="text-right tabular-nums font-semibold">
            {row.original.qty} <span className="text-muted-foreground font-normal">{row.original.uom}</span>
          </div>
        ),
      },
      {
        id: "ref",
        header: "Referencia",
        accessorFn: (r) => (r.ref?.kind ? `${r.ref.kind}:${r.ref.id}` : ""),
        cell: ({ row }) =>
          row.original.ref?.kind ? (
            <div className="text-xs">
              <div className="font-medium">{row.original.ref.kind}</div>
              <div className="text-muted-foreground truncate max-w-[220px]">{row.original.ref.id || "-"}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "note",
        header: "Nota",
        accessorFn: (r) => r.note ?? "",
        cell: ({ row }) => (
          <div className="text-sm max-w-[360px] truncate">
            {row.original.note ?? <span className="text-muted-foreground">-</span>}
          </div>
        ),
      },
    ];
  }, []);

  return (
    <div className="space-y-4">
      <StockPageHeader
        title="Movimientos de Stock"
        description="Historial completo de cambios de inventario. Cada registro es inmutable — funciona como un libro contable. Filtrá por tipo, depósito o rango de fechas."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock", href: "/dashboard/stock/balances" },
          { label: "Movimientos" },
        ]}
        actions={
          <div className="flex gap-2">
            <ReserveDialog />
            <ProduceDialog />
            <MovementDialog />
          </div>
        }
      />

      {/* Movement type legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { type: "IN", desc: "Compra o recepción de material" },
          { type: "OUT", desc: "Entrega a proyecto o cliente" },
          { type: "PRODUCE", desc: "Fabricación de ventana/puerta" },
          { type: "TRANSFER", desc: "Mover entre depósitos" },
          { type: "ADJUST", desc: "Corrección por inventario físico" },
          { type: "RESERVE", desc: "Apartar material para proyecto" },
          { type: "UNRESERVE", desc: "Liberar reserva de proyecto" },
        ].map(({ type, desc }) => {
          const b = typeBadge(type);
          return (
            <div key={type} className="flex items-start gap-2 rounded-lg border p-2.5 bg-card">
              <Badge variant={b.variant} className="text-[10px] shrink-0">{b.label}</Badge>
              <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <FilterChipsBar
            chips={chips}
            onClearAll={() => {
              setWarehouseId("all");
              setTypeFilter("all");
            }}
          />

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todos los depósitos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los depósitos</SelectItem>
                  {(warehouses ?? []).map((w) => (
                    <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v) => { if (isMovementTypeFilter(v)) setTypeFilter(v); }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="IN">Ingreso (IN)</SelectItem>
                  <SelectItem value="OUT">Egreso (OUT)</SelectItem>
                  <SelectItem value="PRODUCE">Producción (PRODUCE)</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia (TRANSFER)</SelectItem>
                  <SelectItem value="ADJUST">Ajuste (ADJUST)</SelectItem>
                  <SelectItem value="RESERVE">Reserva (RESERVE)</SelectItem>
                  <SelectItem value="UNRESERVE">Libera reserva (UNRESERVE)</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Desde</Label>
                <Input type="date" className="h-9 w-[150px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs whitespace-nowrap">Hasta</Label>
                <Input type="date" className="h-9 w-[150px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>

              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs">
                  Limpiar fechas
                </Button>
              )}

              <div className="text-xs text-muted-foreground ml-auto">
                {isFetching ? "Actualizando..." : rows.length ? `${rows.length} registros` : ""}
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={rows}
            isLoading={isFetching}
            searchPlaceholder="Buscar por SKU, item, tipo, referencia, nota..."
            emptyTitle="Sin movimientos"
            emptyDesc="Todavía no registraste ingresos/egresos/ajustes/transferencias."
            initialPageSize={25}
          />
        </CardContent>
      </Card>
    </div>
  );
}
