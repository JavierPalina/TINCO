"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterChipsBar } from "@/components/stock/FilterChipsBar";

type Warehouse = { _id: string; name: string };

type Reservation = {
  _id: string;
  ref: { kind: string; id: string };
  warehouseId: { _id?: string; name: string };
  status: string;
  lines: { itemId: { sku: string; name: string }; qty: number; uom: string }[];
  createdAt: string;
};

type KindFilter = "PROJECT" | "QUOTE" | "MANUAL" | "PO" | "SO";
type StatusFilter = "all" | "ACTIVE" | "RELEASED";

function formatDateTimeAR(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-AR"),
    time: d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    ACTIVE: { label: "Activa", variant: "default" },
    RELEASED: { label: "Liberada", variant: "secondary" },
  };
  return map[status] ?? { label: status, variant: "outline" };
}

export function ReservationsTable() {
  const qc = useQueryClient();

  const [kind, setKind] = useState<KindFilter>("PROJECT");
  const [refId, setRefId] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [warehouseId, setWarehouseId] = useState<string>("all");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => (await axios.get("/api/warehouses")).data.data,
  });

  const queryKey = useMemo(
    () => ["reservations", kind, refId, status, warehouseId],
    [kind, refId, status, warehouseId],
  );

  const { data, isFetching } = useQuery<Reservation[]>({
    queryKey,
    queryFn: async () => {
      const params: any = { kind };

      // refId: si está vacío, no filtrar por id
      if (refId.trim()) params.refId = refId.trim();

      // status: "all" no filtra
      if (status !== "all") params.status = status;

      // warehouseId: "all" no filtra
      if (warehouseId !== "all") params.warehouseId = warehouseId;

      const { data } = await axios.get("/api/stock/reservations", { params });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });

  const rows = data ?? [];

  const chips = useMemo(() => {
    const arr: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    arr.push({
      key: "kind",
      label: "Tipo ref",
      value: kind,
      onRemove: () => setKind("PROJECT"),
    });

    if (refId.trim()) {
      arr.push({
        key: "refId",
        label: "Ref id",
        value: refId.trim(),
        onRemove: () => setRefId(""),
      });
    }

    if (status !== "all") {
      const b = statusBadge(status);
      arr.push({
        key: "status",
        label: "Estado",
        value: b.label,
        onRemove: () => setStatus("all"),
      });
    }

    if (warehouseId !== "all") {
      const name = warehouses?.find((w) => w._id === warehouseId)?.name ?? warehouseId;
      arr.push({
        key: "warehouse",
        label: "Depósito",
        value: name,
        onRemove: () => setWarehouseId("all"),
      });
    }

    return arr;
  }, [kind, refId, status, warehouseId, warehouses]);

  const releaseMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.post(`/api/stock/reservations/${id}/release`);
    },
    onSuccess: () => {
      toast.success("Reserva liberada");
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["stockBalances"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error liberando reserva"),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <FilterChipsBar
          chips={chips}
          onClearAll={() => {
            setKind("PROJECT");
            setRefId("");
            setStatus("all");
            setWarehouseId("all");
          }}
        />

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Tipo de referencia</div>
              <Select value={kind} onValueChange={(v) => setKind(v as KindFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROJECT">Proyecto (PROJECT)</SelectItem>
                  <SelectItem value="QUOTE">Cotización (QUOTE)</SelectItem>
                  <SelectItem value="SO">Pedido (SO)</SelectItem>
                  <SelectItem value="PO">Orden de compra (PO)</SelectItem>
                  <SelectItem value="MANUAL">Manual (MANUAL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Ref id</div>
              <Input value={refId} onChange={(e) => setRefId(e.target.value)} placeholder="Ej: PROJ-ACME-01" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Estado</div>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ACTIVE">Activa</SelectItem>
                  <SelectItem value="RELEASED">Liberada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Depósito</div>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(warehouses ?? []).map((w) => (
                    <SelectItem key={w._id} value={w._id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-xs text-muted-foreground flex items-center justify-end min-w-[180px]">
            {isFetching ? "Actualizando..." : rows.length ? `${rows.length} reservas` : ""}
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((r) => {
            const s = statusBadge(r.status);
            const dt = formatDateTimeAR(r.createdAt);
            const canRelease = r.status === "ACTIVE" && !releaseMutation.isPending;

            return (
              <div key={r._id} className="border rounded-xl p-4 bg-card">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">
                        {r.ref.kind}:{r.ref.id}
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Depósito: <span className="font-medium text-foreground">{r.warehouseId?.name ?? "-"}</span>
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      Creada: <span className="font-medium text-foreground">{dt.date}</span> · {dt.time}
                    </div>
                  </div>

                  <div className="flex gap-2 md:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => releaseMutation.mutate(r._id)}
                      disabled={!canRelease}
                    >
                      {releaseMutation.isPending && canRelease ? "Liberando..." : "Liberar"}
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-2">Líneas reservadas</div>
                  <ul className="space-y-1">
                    {r.lines.map((l, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{l.itemId?.sku ?? "-"}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {l.itemId?.name ?? "-"}
                          </div>
                        </div>
                        <div className="text-sm tabular-nums font-semibold whitespace-nowrap">
                          {l.qty} <span className="text-muted-foreground font-normal">{l.uom}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="text-sm text-muted-foreground border rounded-xl p-10 text-center">
              Sin reservas para los filtros actuales.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
