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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Warehouse = { _id: string; name: string };
type Location = { _id: string; code: string; warehouseId: string };
type Item = { _id: string; sku: string; name: string; uom: "UN" | "M" | "M2" | "KG"; type: string };

type MovementType = "IN" | "OUT" | "ADJUST" | "TRANSFER";

const NONE_LOCATION = "__none__"; // sentinel: Radix SelectItem no permite value=""

function toNumberSafe(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function MovementDialog({
  onDone,
  open: controlledOpen,
  onOpenChange,
  defaults,
}: {
  onDone?: () => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  defaults?: {
    type?: "IN" | "OUT" | "ADJUST" | "TRANSFER";
    itemId?: string;
    warehouseId?: string;
    locationId?: string;
  };
}) {
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = controlledOpen ?? openUncontrolled;
  const setOpen = onOpenChange ?? setOpenUncontrolled;
  const qc = useQueryClient();

  const [type, setType] = useState<MovementType>("IN");
  const [itemSearch, setItemSearch] = useState("");
  const [itemId, setItemId] = useState<string>("");

  // Simple movement fields
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>(""); // opcional
  const [qty, setQty] = useState<string>("1");
  const [uom, setUom] = useState<Item["uom"]>("UN");
  const [unitCost, setUnitCost] = useState<string>(""); // opcional
  const [note, setNote] = useState<string>("");

  // Transfer fields
  const [fromWarehouseId, setFromWarehouseId] = useState<string>("");
  const [fromLocationId, setFromLocationId] = useState<string>("");
  const [toWarehouseId, setToWarehouseId] = useState<string>("");
  const [toLocationId, setToLocationId] = useState<string>("");

  // Ref (opcional)
  const [refKind, setRefKind] = useState<string>("MANUAL");
  const [refId, setRefId] = useState<string>("");

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data } = await axios.get("/api/warehouses");
      return data.data;
    },
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: ["items", itemSearch],
    queryFn: async () => {
      const { data } = await axios.get("/api/items", { params: { search: itemSearch, active: true } });
      return data.data;
    },
  });

  const locationsKey = useMemo(() => ["locationsByWarehouse", warehouseId], [warehouseId]);
  const { data: locationsForWarehouse } = useQuery<Location[]>({
    queryKey: locationsKey,
    queryFn: async () => {
      if (!warehouseId) return [];
      const { data } = await axios.get(`/api/warehouses/${warehouseId}/locations`);
      return data.data;
    },
    enabled: !!warehouseId,
  });

  const { data: locationsFrom } = useQuery<Location[]>({
    queryKey: ["locationsByWarehouse", fromWarehouseId],
    queryFn: async () => {
      if (!fromWarehouseId) return [];
      const { data } = await axios.get(`/api/warehouses/${fromWarehouseId}/locations`);
      return data.data;
    },
    enabled: !!fromWarehouseId,
  });

  const { data: locationsTo } = useQuery<Location[]>({
    queryKey: ["locationsByWarehouse", toWarehouseId],
    queryFn: async () => {
      if (!toWarehouseId) return [];
      const { data } = await axios.get(`/api/warehouses/${toWarehouseId}/locations`);
      return data.data;
    },
    enabled: !!toWarehouseId,
  });

  // Sync uom al seleccionar item
  const selectedItem = useMemo(() => items?.find((i) => i._id === itemId), [items, itemId]);
  const itemLabel = (i: Item) => `${i.sku} · ${i.name}`;

  const mutation = useMutation({
    mutationFn: async () => {
      const qtyNum = toNumberSafe(qty);

      const ref = refId.trim()
        ? { kind: refKind.trim() || "MANUAL", id: refId.trim() }
        : undefined;

      if (!itemId) throw new Error("Seleccioná un item");
      if (qtyNum <= 0) throw new Error("Cantidad inválida");

      const uomFinal = selectedItem?.uom ?? uom;

      if (type === "TRANSFER") {
        if (!fromWarehouseId || !toWarehouseId) throw new Error("Seleccioná depósitos de origen y destino");
        if (fromWarehouseId === toWarehouseId && (fromLocationId || "") === (toLocationId || "")) {
          throw new Error("Transferencia inválida: origen y destino iguales");
        }

        await axios.post("/api/stock/movements", {
          type: "TRANSFER",
          itemId,
          uom: uomFinal,
          qty: qtyNum,
          from: { warehouseId: fromWarehouseId, locationId: fromLocationId || undefined },
          to: { warehouseId: toWarehouseId, locationId: toLocationId || undefined },
          note: note.trim() || undefined,
          ref,
        });
        return;
      }

      if (!warehouseId) throw new Error("Seleccioná un depósito");

      const payload: any = {
        type,
        itemId,
        warehouseId,
        locationId: locationId || undefined,
        qty: type === "ADJUST" ? toNumberSafe(qty) : qtyNum,
        uom: uomFinal,
        note: note.trim() || undefined,
        ref,
      };

      const costNum = unitCost.trim() ? toNumberSafe(unitCost) : undefined;
      if (typeof costNum === "number" && costNum >= 0 && type === "IN") payload.unitCost = costNum;

      await axios.post("/api/stock/movements", payload);
    },
    onSuccess: () => {
      toast.success("Movimiento registrado");
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

  function resetForNew() {
    setType(defaults?.type ?? "IN");
    setItemSearch("");
    setItemId(defaults?.itemId ?? "");
    setWarehouseId(defaults?.warehouseId ?? "");
    setLocationId(defaults?.locationId ?? "");
    setQty("1");
    setUom("UN");
    setUnitCost("");
    setNote("");
    setFromWarehouseId("");
    setFromLocationId("");
    setToWarehouseId("");
    setToLocationId("");
    setRefKind("MANUAL");
    setRefId("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetForNew();
      }}
    >
      <DialogTrigger asChild>
        <Button>Nuevo movimiento</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Registrar movimiento de stock</DialogTitle>
          <DialogDescription>
            Ingreso, egreso, ajuste o transferencia entre depósitos/ubicaciones.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground">Tipo</label>
                <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">IN (Ingreso)</SelectItem>
                    <SelectItem value="OUT">OUT (Egreso)</SelectItem>
                    <SelectItem value="ADJUST">ADJUST (Ajuste +/-)</SelectItem>
                    <SelectItem value="TRANSFER">TRANSFER (Transferencia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground">Buscar item</label>
                <Input
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Buscar por SKU o nombre..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs text-muted-foreground">Item</label>
                <Select
                  value={itemId}
                  onValueChange={(v) => {
                    setItemId(v);
                    const it = items?.find((x) => x._id === v);
                    if (it) setUom(it.uom);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(items ?? []).map((i) => (
                      <SelectItem key={i._id} value={i._id}>
                        {itemLabel(i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedItem && (
                  <div className="text-xs text-muted-foreground mt-1">
                    UOM: <span className="font-semibold">{selectedItem.uom}</span> · Tipo:{" "}
                    <span className="font-semibold">{selectedItem.type}</span>
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground">
                  {type === "ADJUST" ? "Cantidad (+/-)" : "Cantidad"}
                </label>
                <Input
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder={type === "ADJUST" ? "-2 / 3" : "1"}
                />
              </div>
            </div>

            {type !== "TRANSFER" ? (
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
                      <SelectValue placeholder="Seleccionar depósito..." />
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
                      <SelectValue placeholder={warehouseId ? "Seleccionar ubicación..." : "Elegí depósito"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_LOCATION}>Sin ubicación</SelectItem>
                      {(locationsForWarehouse ?? []).map((l) => (
                        <SelectItem key={l._id} value={l._id}>
                          {l.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Costo unitario (solo IN)</label>
                  <Input
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="0"
                    disabled={type !== "IN"}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2 border rounded-md p-3">
                  <div className="text-sm font-semibold">Origen</div>

                  <div>
                    <label className="text-xs text-muted-foreground">Depósito origen</label>
                    <Select
                      value={fromWarehouseId}
                      onValueChange={(v) => {
                        setFromWarehouseId(v);
                        setFromLocationId("");
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
                    <label className="text-xs text-muted-foreground">Ubicación origen (opcional)</label>
                    <Select
                      value={fromLocationId || NONE_LOCATION}
                      onValueChange={(v) => setFromLocationId(v === NONE_LOCATION ? "" : v)}
                      disabled={!fromWarehouseId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={fromWarehouseId ? "Seleccionar..." : "Elegí depósito"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_LOCATION}>Sin ubicación</SelectItem>
                        {(locationsFrom ?? []).map((l) => (
                          <SelectItem key={l._id} value={l._id}>
                            {l.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 border rounded-md p-3">
                  <div className="text-sm font-semibold">Destino</div>

                  <div>
                    <label className="text-xs text-muted-foreground">Depósito destino</label>
                    <Select
                      value={toWarehouseId}
                      onValueChange={(v) => {
                        setToWarehouseId(v);
                        setToLocationId("");
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
                    <label className="text-xs text-muted-foreground">Ubicación destino (opcional)</label>
                    <Select
                      value={toLocationId || NONE_LOCATION}
                      onValueChange={(v) => setToLocationId(v === NONE_LOCATION ? "" : v)}
                      disabled={!toWarehouseId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={toWarehouseId ? "Seleccionar..." : "Elegí depósito"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_LOCATION}>Sin ubicación</SelectItem>
                        {(locationsTo ?? []).map((l) => (
                          <SelectItem key={l._id} value={l._id}>
                            {l.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Ref kind (opcional)</label>
                <Input
                  value={refKind}
                  onChange={(e) => setRefKind(e.target.value)}
                  placeholder="MANUAL / PO / PROJECT ..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ref id (opcional)</label>
                <Input value={refId} onChange={(e) => setRefId(e.target.value)} placeholder="ID externo / nro doc" />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs text-muted-foreground">Nota</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Observación..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
