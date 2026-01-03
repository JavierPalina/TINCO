// src/components/stock/BomEditor.tsx
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

type Item = { _id: string; sku: string; name: string; type: string; uom: string };

type BomLine = { componentItemId: Item; qty: number; uom: string };

type Bom = {
  _id: string;
  finishedItemId: Item;
  version: number;
  active: boolean;
  lines: BomLine[];
};

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error?: unknown };
type ApiResp<T> = ApiOk<T> | ApiErr;

function toNumberSafe(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function itemLabel(i: Item) {
  return `${i.sku} · ${i.name}`;
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { error?: unknown } | undefined;
    if (typeof d?.error === "string") return d.error;
    if (d?.error && typeof d.error === "object") {
      // zod flatten u otras estructuras
      try {
        return JSON.stringify(d.error);
      } catch {
        /* ignore */
      }
    }
    if (typeof err.message === "string" && err.message.trim()) return err.message;
    return "Error de red / servidor";
  }
  if (err instanceof Error) return err.message || "Error";
  if (typeof err === "string") return err;
  return "Error";
}

export function BomEditor() {
  const qc = useQueryClient();

  // Selección del producto terminado (FINISHED)
  const [finishedSearch, setFinishedSearch] = useState("");
  const [finishedItemId, setFinishedItemId] = useState<string>("");

  // Búsqueda / selección de componente
  const [componentSearch, setComponentSearch] = useState("");
  const [componentItemId, setComponentItemId] = useState<string>("");

  // Campos de la línea (MVP: 1 línea)
  const [qty, setQty] = useState("1");
  const [uom, setUom] = useState("UN");

  // Versión (si está vacío, se sugiere la próxima)
  const [version, setVersion] = useState<string>("");

  // Items FINISHED para elegir
  const { data: finishedItems, isFetching: fetchingFinished } = useQuery<Item[]>({
    queryKey: ["items", "finished", finishedSearch],
    queryFn: async () => {
      const res = await axios.get<ApiResp<Item[]>>("/api/items", {
        params: { search: finishedSearch, active: true, type: "FINISHED" },
      });
      return (res.data as ApiOk<Item[]>).data ?? [];
    },
  });

  // Items para componentes (activos; si querés, podés filtrar por type=RAW/COMPONENT)
  const { data: componentItems, isFetching: fetchingComponents } = useQuery<Item[]>({
    queryKey: ["items", "components", componentSearch],
    queryFn: async () => {
      const res = await axios.get<ApiResp<Item[]>>("/api/items", {
        params: { search: componentSearch, active: true },
      });
      return (res.data as ApiOk<Item[]>).data ?? [];
    },
  });

  const queryKey = useMemo(() => ["boms", finishedItemId], [finishedItemId]);

  const { data: boms, isFetching: fetchingBoms } = useQuery<Bom[]>({
    queryKey,
    queryFn: async () => {
      const res = await axios.get<ApiResp<Bom[]>>("/api/boms", { params: { finishedItemId } });
      return (res.data as ApiOk<Bom[]>).data ?? [];
    },
    placeholderData: keepPreviousData,
    enabled: !!finishedItemId,
  });

  const sortedBoms = useMemo(() => {
    const arr = [...(boms ?? [])];
    arr.sort((a, b) => b.version - a.version);
    return arr;
  }, [boms]);

  const activeBom = useMemo(() => sortedBoms.find((b) => b.active), [sortedBoms]);

  const suggestedNextVersion = useMemo(() => {
    if (!sortedBoms.length) return 1;
    const maxV = Math.max(...sortedBoms.map((b) => b.version));
    return maxV + 1;
  }, [sortedBoms]);

  const effectiveVersion = version.trim() ? toNumberSafe(version) : suggestedNextVersion;

  const selectedFinished = useMemo(
    () => finishedItems?.find((i) => i._id === finishedItemId) ?? sortedBoms[0]?.finishedItemId,
    [finishedItems, finishedItemId, sortedBoms],
  );

  const selectedComponent = useMemo(
    () => componentItems?.find((i) => i._id === componentItemId),
    [componentItems, componentItemId],
  );

  function onPickComponent(id: string) {
    setComponentItemId(id);
    const it = componentItems?.find((x) => x._id === id);
    if (it?.uom) setUom(it.uom);
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!finishedItemId) throw new Error("Seleccioná un producto terminado (FINISHED)");
      if (!componentItemId) throw new Error("Seleccioná un componente");
      const q = toNumberSafe(qty);
      if (q <= 0) throw new Error("Cantidad inválida");
      if (!String(uom || "").trim()) throw new Error("UOM inválida");

      const payload = {
        finishedItemId,
        version: effectiveVersion,
        active: true,
        lines: [{ componentItemId, qty: q, uom: String(uom).trim() }],
      };

      const res = await axios.post<ApiResp<Bom>>("/api/boms", payload);
      if (!("ok" in res.data) || res.data.ok !== true) throw new Error("Error creando BOM");
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("BOM creada");
      qc.invalidateQueries({ queryKey: ["boms"] });

      // UX: limpiar línea pero mantener finishedItemId
      setComponentItemId("");
      setComponentSearch("");
      setQty("1");
      setUom("UN");
      setVersion("");
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err));
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Panel editor */}
      <Card className="lg:col-span-1">
        <CardContent className="p-4 space-y-4">
          <div>
            <div className="text-sm font-semibold">Definir BOM</div>
            <div className="text-xs text-muted-foreground mt-1">
              Seleccioná el producto terminado y agregá componentes. La versión activa se usa en Producción.
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Buscar producto terminado (FINISHED)</label>
            <Input
              value={finishedSearch}
              onChange={(e) => setFinishedSearch(e.target.value)}
              placeholder="Buscar por SKU o nombre..."
            />
            <Select
              value={finishedItemId}
              onValueChange={(v) => {
                setFinishedItemId(v);
                setComponentItemId("");
                setComponentSearch("");
                setQty("1");
                setUom("UN");
                setVersion("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={fetchingFinished ? "Cargando..." : "Seleccionar producto..."} />
              </SelectTrigger>
              <SelectContent>
                {(finishedItems ?? []).map((i) => (
                  <SelectItem key={i._id} value={i._id}>
                    {itemLabel(i)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedFinished ? (
              <div className="text-xs text-muted-foreground">
                SKU: <span className="font-semibold">{selectedFinished.sku}</span> · UOM producto:{" "}
                <span className="font-semibold">{selectedFinished.uom}</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">Elegí un producto terminado para ver/crear BOMs.</div>
            )}
          </div>

          <div className="border rounded-xl p-3 space-y-3">
            <div className="text-sm font-semibold">Nueva versión</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Versión</label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder={`Sugerida: ${suggestedNextVersion}`}
                  disabled={!finishedItemId}
                />
                <div className="text-[11px] text-muted-foreground mt-1">
                  Recomendación: crear una versión nueva en vez de editar la anterior.
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <div className="h-10 flex items-center">
                  <Badge variant="default">Activa</Badge>
                  <span className="text-xs text-muted-foreground ml-2">Se usará en Producción</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Buscar componente</label>
              <Input
                value={componentSearch}
                onChange={(e) => setComponentSearch(e.target.value)}
                placeholder="Buscar por SKU o nombre..."
                disabled={!finishedItemId}
              />
              <Select value={componentItemId} onValueChange={onPickComponent} disabled={!finishedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder={fetchingComponents ? "Cargando..." : "Seleccionar componente..."} />
                </SelectTrigger>
                <SelectContent>
                  {(componentItems ?? []).map((i) => (
                    <SelectItem key={i._id} value={i._id}>
                      {itemLabel(i)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedComponent ? (
                <div className="text-xs text-muted-foreground">
                  UOM componente: <span className="font-semibold">{selectedComponent.uom}</span> · Tipo:{" "}
                  <span className="font-semibold">{selectedComponent.type}</span>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Cantidad</label>
                <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Ej: 2" disabled={!finishedItemId} />
                <div className="text-[11px] text-muted-foreground mt-1">
                  Cantidad del componente necesaria para producir 1 unidad del producto terminado.
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">UOM</label>
                <Input value={uom} onChange={(e) => setUom(e.target.value)} placeholder="UN / KG / M..." disabled={!finishedItemId} />
              </div>
            </div>

            <Button
              onClick={() => createMutation.mutate()}
              disabled={!finishedItemId || !componentItemId || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? "Creando..." : "Crear BOM (nueva versión)"}
            </Button>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Nota: este editor crea una BOM con una línea (MVP). El siguiente paso natural es permitir múltiples líneas antes de guardar.
          </div>
        </CardContent>
      </Card>

      {/* Panel listado */}
      <Card className="lg:col-span-2">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">Versiones existentes</div>
              <div className="text-xs text-muted-foreground mt-1">
                {finishedItemId ? "Listado de versiones para el producto seleccionado." : "Seleccioná un producto terminado para listar sus BOMs."}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              {finishedItemId
                ? fetchingBoms
                  ? "Actualizando..."
                  : sortedBoms.length
                    ? `${sortedBoms.length} versiones`
                    : "0 versiones"
                : ""}
            </div>
          </div>

          {finishedItemId && activeBom ? (
            <div className="border rounded-xl p-3 bg-card">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Activa</Badge>
                <div className="text-sm font-semibold">
                  v{activeBom.version} · {activeBom.finishedItemId.sku} · {activeBom.finishedItemId.name}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Esta es la versión que se utilizará cuando registres una Producción.
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {sortedBoms.map((b) => (
              <div key={b._id} className="border rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">
                        {b.finishedItemId?.sku} · {b.finishedItemId?.name}
                      </div>
                      <Badge variant="outline">v{b.version}</Badge>
                      {b.active ? <Badge variant="default">Activa</Badge> : <Badge variant="secondary">Inactiva</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Componentes: <span className="font-medium text-foreground">{b.lines.length}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-2">Líneas</div>
                  <ul className="space-y-1">
                    {b.lines.map((l, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{l.componentItemId?.sku ?? "-"}</div>
                          <div className="text-xs text-muted-foreground truncate">{l.componentItemId?.name ?? "-"}</div>
                        </div>
                        <div className="text-sm tabular-nums font-semibold whitespace-nowrap">
                          {l.qty} <span className="text-muted-foreground font-normal">{l.uom}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {finishedItemId && sortedBoms.length === 0 && (
              <div className="text-sm text-muted-foreground border rounded-xl p-10 text-center">
                Sin BOMs para este producto. Creá la primera versión desde el panel izquierdo.
              </div>
            )}

            {!finishedItemId && (
              <div className="text-sm text-muted-foreground border rounded-xl p-10 text-center">
                Seleccioná un producto terminado para ver sus BOMs.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
