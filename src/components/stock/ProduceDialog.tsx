"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Warehouse = { _id: string; name: string };
type Location = { _id: string; code: string; warehouseId: string };
type Item = { _id: string; sku: string; name: string; uom: string; type: string };

const NONE_LOCATION = "__none__"; // sentinel: Radix SelectItem no permite value=""

function toNumberSafe(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function ProduceDialog({ onDone }: { onDone?: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  const [itemSearch, setItemSearch] = useState("");
  const [finishedItemId, setFinishedItemId] = useState("");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => (await axios.get("/api/warehouses")).data.data,
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["items", itemSearch, "finishedOnly"],
    queryFn: async () => {
      const { data } = await axios.get("/api/items", {
        params: { search: itemSearch, active: true, type: "FINISHED" },
      });
      return data.data;
    },
  });

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["locationsByWarehouse", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      const { data } = await axios.get(`/api/warehouses/${warehouseId}/locations`);
      return data.data;
    },
    enabled: !!warehouseId,
  });

  const selected = useMemo(() => items?.find((i) => i._id === finishedItemId), [items, finishedItemId]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!warehouseId) throw new Error("Seleccioná un depósito");
      if (!finishedItemId) throw new Error("Seleccioná un producto terminado (FINISHED)");
      const q = toNumberSafe(qty);
      if (q <= 0) throw new Error("Cantidad inválida");

      await axios.post("/api/stock/produce", {
        finishedItemId,
        warehouseId,
        locationId: locationId || undefined,
        qty: q,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Producción registrada");
      qc.invalidateQueries({ queryKey: ["stockBalances"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      setOpen(false);
      onDone?.();
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error ?? e?.message ?? "Error";
      toast.error(msg);
    },
  });

  function reset() {
    setWarehouseId("");
    setLocationId("");
    setQty("1");
    setNote("");
    setItemSearch("");
    setFinishedItemId("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Producción</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Registrar producción</DialogTitle>
          <DialogDescription>
            Crea ingreso del producto terminado y registra el consumo de componentes según la BOM activa.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Depósito</label>
                <Select
                  value={warehouseId}
                  onValueChange={(v) => {
                    setWarehouseId(v);
                    setLocationId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(warehouses ?? []).map((w) => (
                      <SelectItem key={w._id} value={w._id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Ubicación (opcional)</label>
                <Select
                  value={locationId || NONE_LOCATION}
                  onValueChange={(v) => setLocationId(v === NONE_LOCATION ? "" : v)}
                  disabled={!warehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={warehouseId ? "Seleccionar..." : "Elegí depósito"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_LOCATION}>Sin ubicación</SelectItem>
                    {(locations ?? []).map((l) => (
                      <SelectItem key={l._id} value={l._id}>
                        {l.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Si no manejás ubicaciones, dejalo en “Sin ubicación”.
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Cantidad a producir</label>
                <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" />
                <div className="text-[11px] text-muted-foreground mt-1">
                  La unidad se toma del producto terminado (UOM del item).
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Buscar producto terminado</label>
              <Input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Buscar por SKU o nombre..."
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Producto terminado</label>
              <Select value={finishedItemId} onValueChange={setFinishedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {(items ?? []).map((i) => (
                    <SelectItem key={i._id} value={i._id}>
                      {i.sku} · {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selected && (
                <div className="text-xs text-muted-foreground mt-1">
                  SKU: <span className="font-semibold">{selected.sku}</span> · UOM:{" "}
                  <span className="font-semibold">{selected.uom}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Nota</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observación..." />
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
