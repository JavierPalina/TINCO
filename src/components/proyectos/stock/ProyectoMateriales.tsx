"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  Package, Plus, Trash2, Loader2, ChevronDown, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Item = { _id: string; sku: string; name: string; uom: string; category: string };
type Balance = { item: Item; warehouse: { _id: string; name: string }; onHand: number; reserved: number; available: number };
type ReserveLine = { itemId: string; qty: number; uom: string; item?: Item | null };
type Reservation = {
  _id: string;
  status: "ACTIVE" | "RELEASED" | "CONSUMED";
  warehouseId: { _id: string; name: string } | null;
  lines: ReserveLine[];
  note?: string;
  createdAt: string;
};
type Warehouse = { _id: string; name: string; type: string };

export function ProyectoMateriales({ proyectoId }: { proyectoId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [lines, setLines] = useState<{ itemId: string; qty: string; uom: string }[]>([]);
  const [note, setNote] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  // Fetch warehouses — usa la misma URL y cacheKey que el resto del módulo de stock
  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const r = await axios.get<{ ok: boolean; data: Warehouse[] }>("/api/warehouses");
      return r.data.data;
    },
    staleTime: 1000 * 60 * 10,
  });

  // Fetch items
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: ["stock-items", itemSearch],
    queryFn: async () => {
      const r = await axios.get<{ ok: boolean; data: Item[] }>(`/api/stock/items?q=${itemSearch}`);
      return r.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch balances for selected warehouse
  const { data: balances = [] } = useQuery<Balance[]>({
    queryKey: ["stock-balances-wh", warehouseId],
    queryFn: async () => {
      const r = await axios.get<{ ok: boolean; data: Balance[] }>(`/api/stock/balances?warehouseId=${warehouseId}`);
      return r.data.data;
    },
    enabled: Boolean(warehouseId),
    staleTime: 1000 * 60 * 2,
  });

  // Fetch existing reservations for this project
  const { data: reservations = [], isLoading: loadingRes } = useQuery<Reservation[]>({
    queryKey: ["proyecto-stock", proyectoId],
    queryFn: async () => {
      const r = await axios.get<{ ok: boolean; data: Reservation[] }>(`/api/proyectos/${proyectoId}/stock`);
      return r.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        warehouseId,
        lines: lines.map((l) => ({ itemId: l.itemId, qty: Number(l.qty), uom: l.uom || "UN" })),
        note,
      };
      await axios.post(`/api/proyectos/${proyectoId}/stock`, payload);
    },
    onSuccess: () => {
      toast.success("Materiales reservados");
      qc.invalidateQueries({ queryKey: ["proyecto-stock", proyectoId] });
      setLines([]);
      setNote("");
    },
    onError: () => toast.error("Error al reservar materiales"),
  });

  const releaseMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      await axios.delete(`/api/proyectos/${proyectoId}/stock`, { data: { reservationId } });
    },
    onSuccess: () => {
      toast.success("Reserva liberada");
      qc.invalidateQueries({ queryKey: ["proyecto-stock", proyectoId] });
    },
    onError: () => toast.error("Error al liberar reserva"),
  });

  const addLine = () => setLines((prev) => [...prev, { itemId: "", qty: "1", uom: "UN" }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: string, value: string) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));

  const balanceMap = new Map(balances.map((b) => [String(b.item._id), b]));

  const activeReservations = reservations.filter((r) => r.status === "ACTIVE");

  return (
    <Card className="border-primary/20">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                Materiales del Proyecto
                {activeReservations.length > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {activeReservations.length} reserva{activeReservations.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardTitle>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">

            {/* Existing reservations */}
            {loadingRes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando reservas...
              </div>
            ) : activeReservations.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reservas activas</p>
                {activeReservations.map((res) => (
                  <div key={res._id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs">
                          Activa
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {res.warehouseId?.name ?? "—"} · {new Date(res.createdAt).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => releaseMutation.mutate(res._id)}
                        disabled={releaseMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {res.lines.map((line, i) => {
                        const bal = balanceMap.get(String(line.itemId));
                        const avail = bal?.available ?? null;
                        return (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">
                              {line.item?.name ?? line.item?.sku ?? String(line.itemId).slice(-6)}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{line.qty} {line.uom}</span>
                              {avail !== null && (
                                avail >= 0
                                  ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  : <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {res.note && <p className="text-xs text-muted-foreground italic">{res.note}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Package className="h-4 w-4" />
                Sin materiales reservados para este proyecto.
              </div>
            )}

            {/* New reservation form */}
            <div className="border rounded-lg p-3 space-y-3 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nueva reserva de materiales</p>

              <div className="space-y-1">
                <Label className="text-xs">Depósito / Almacén</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Seleccionar depósito..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {warehouseId && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Buscar material</Label>
                    <Input
                      className="h-8"
                      placeholder="SKU o nombre..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    {lines.map((line, i) => {
                      const bal = balanceMap.get(line.itemId);
                      return (
                        <div key={i} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-1">
                            <Select value={line.itemId} onValueChange={(v) => updateLine(i, "itemId", v)}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Seleccionar ítem..." />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((it) => {
                                  const b = balanceMap.get(it._id);
                                  return (
                                    <SelectItem key={it._id} value={it._id}>
                                      <span className="flex items-center gap-2">
                                        <span>{it.name}</span>
                                        {b && (
                                          <span className={`text-xs ${b.available > 0 ? "text-green-600" : "text-destructive"}`}>
                                            ({b.available} disponible)
                                          </span>
                                        )}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {bal && bal.available <= 0 && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Sin stock disponible
                              </p>
                            )}
                          </div>
                          <Input
                            className="h-8 w-20"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.qty}
                            onChange={(e) => updateLine(i, "qty", e.target.value)}
                            placeholder="Cant."
                          />
                          <Select value={line.uom} onValueChange={(v) => updateLine(i, "uom", v)}>
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["UN", "M", "M2", "KG"].map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeLine(i)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      );
                    })}
                    <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={addLine}>
                      <Plus className="h-3.5 w-3.5" /> Agregar material
                    </Button>
                  </div>

                  {lines.length > 0 && (
                    <>
                      <Input
                        className="h-8"
                        placeholder="Nota (opcional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <Button
                        className="w-full"
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending || !lines.every((l) => l.itemId && Number(l.qty) > 0)}
                      >
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Reservar materiales
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
