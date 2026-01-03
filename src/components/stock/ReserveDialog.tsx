// src/components/stock/ReserveDialog.tsx
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
type Item = { _id: string; sku: string; name: string; uom: "UN" | "M" | "M2" | "KG"; type: string };

type Line = { itemId: string; qty: string; uom: Item["uom"] };

function toNumberSafe(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // tu API suele devolver { error: string } o { error: {...} }
    const data = err.response?.data as { error?: unknown } | undefined;
    if (typeof data?.error === "string") return data.error;
    if (data?.error) return "Error de validación";
    return err.message || "Error";
  }
  if (err instanceof Error) return err.message;
  return "Error";
}

export function ReserveDialog({
  onDone,
  open: controlledOpen,
  onOpenChange,
  defaults,
}: {
  onDone?: () => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  defaults?: {
    warehouseId?: string;
    refKind?: string;
    refId?: string;
    lines?: Array<{ itemId: string; qty: string }>;
  };
}) {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = controlledOpen ?? openUncontrolled;
  const setOpen = onOpenChange ?? setOpenUncontrolled;

  const qc = useQueryClient();

  const [warehouseId, setWarehouseId] = useState("");
  const [refKind, setRefKind] = useState("PROJECT");
  const [refId, setRefId] = useState("");
  const [note, setNote] = useState("");

  const [itemSearch, setItemSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([{ itemId: "", qty: "1", uom: "UN" }]);

  function reset() {
    setWarehouseId(defaults?.warehouseId ?? "");
    setRefKind(defaults?.refKind ?? "PROJECT");
    setRefId(defaults?.refId ?? "");
    setNote("");
    setItemSearch("");
    setLines(
      defaults?.lines?.length
        ? defaults.lines.map((l) => ({ itemId: l.itemId, qty: l.qty, uom: "UN" as const }))
        : [{ itemId: "", qty: "1", uom: "UN" as const }],
    );
  }

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => (await axios.get("/api/warehouses")).data.data,
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["items", itemSearch],
    queryFn: async () =>
      (await axios.get("/api/items", { params: { search: itemSearch, active: true } })).data.data,
  });

  const selectedItemById = useMemo(() => {
    const map = new Map<string, Item>();
    (items ?? []).forEach((i) => map.set(i._id, i));
    return map;
  }, [items]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!warehouseId) throw new Error("Seleccioná un depósito");
      if (!refKind.trim() || !refId.trim()) throw new Error("Completá ref.kind y ref.id");

      const normalized = lines
        .filter((l) => l.itemId && toNumberSafe(l.qty) > 0)
        .map((l) => {
          const it = selectedItemById.get(l.itemId);
          const uom = it?.uom ?? l.uom;
          return { itemId: l.itemId, qty: toNumberSafe(l.qty), uom };
        });

      if (normalized.length === 0) throw new Error("Agregá al menos una línea válida");

      await axios.post("/api/stock/reservations", {
        warehouseId,
        ref: { kind: refKind.trim(), id: refId.trim() },
        lines: normalized,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Reserva creada");
      qc.invalidateQueries({ queryKey: ["reservations"] });
      qc.invalidateQueries({ queryKey: ["stockBalances"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      setOpen(false);
      onDone?.();
    },
    onError: (e: unknown) => {
      toast.error(getErrorMessage(e));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Nueva reserva</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Crear reserva</DialogTitle>
          <DialogDescription>Reserva stock disponible en un depósito. Afecta reserved/available.</DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Depósito</label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
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
                <label className="text-xs text-muted-foreground">Ref kind</label>
                <Input
                  value={refKind}
                  onChange={(e) => setRefKind(e.target.value)}
                  placeholder="PROJECT / QUOTE / MANUAL"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Ref id</label>
                <Input value={refId} onChange={(e) => setRefId(e.target.value)} placeholder="ID externo" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Buscar item</label>
              <Input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Buscar por SKU o nombre..."
              />
            </div>

            <div className="space-y-2">
              {lines.map((l, idx) => {
                const it = items?.find((x) => x._id === l.itemId);
                return (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 border rounded-md p-2">
                    <div className="md:col-span-4">
                      <label className="text-xs text-muted-foreground">Item</label>
                      <Select
                        value={l.itemId}
                        onValueChange={(v) => {
                          const picked = items?.find((x) => x._id === v);
                          setLines((prev) =>
                            prev.map((p, i) => (i === idx ? { ...p, itemId: v, uom: picked?.uom ?? p.uom } : p)),
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(items ?? []).map((i) => (
                            <SelectItem key={i._id} value={i._id}>
                              {i.sku} · {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {it ? (
                        <div className="text-xs text-muted-foreground mt-1">
                          UOM: <span className="font-semibold">{it.uom}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="md:col-span-1">
                      <label className="text-xs text-muted-foreground">Qty</label>
                      <Input
                        value={l.qty}
                        onChange={(e) =>
                          setLines((prev) => prev.map((p, i) => (i === idx ? { ...p, qty: e.target.value } : p)))
                        }
                        placeholder="1"
                      />
                    </div>

                    <div className="md:col-span-1 flex md:flex-col gap-2 md:gap-1">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground">UOM</label>
                        <Input value={l.uom} readOnly />
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        className="md:mt-6"
                        onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={lines.length === 1}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setLines((prev) => [...prev, { itemId: "", qty: "1", uom: "UN" }])}
            >
              Agregar línea
            </Button>

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
            Crear reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
