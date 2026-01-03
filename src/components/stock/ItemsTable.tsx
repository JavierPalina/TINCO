// src/components/stock/ItemsTable.tsx
"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Item = {
  _id: string;
  type: "FINISHED" | "COMPONENT" | "SERVICE";
  sku: string;
  name: string;
  category: string;
  uom: "UN" | "M" | "M2" | "KG";
  active: boolean;
};

type ItemForm = {
  type: Item["type"];
  sku: string;
  name: string;
  category: string;
  uom: Item["uom"];
};

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const apiMsg = (err.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof apiMsg === "string") return apiMsg;
  }
  if (err instanceof Error) return err.message;
  return "Error";
}

export function ItemsTable() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<ItemForm>({
    type: "COMPONENT",
    sku: "",
    name: "",
    category: "Perfil",
    uom: "UN",
  });

  const queryKey = useMemo(() => ["items", search], [search]);

  const { data, isFetching } = useQuery<Item[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get("/api/items", { params: { search } });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, active: true, track: { lot: false, serial: false } };
      const { data } = await axios.post("/api/items", payload);
      return data.data;
    },
    onSuccess: () => {
      toast.success("Item creado");
      setForm((p) => ({ ...p, sku: "", name: "" }));
      qc.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex gap-2 items-center">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por SKU o nombre..." />
            <div className="text-xs text-muted-foreground">{isFetching ? "Actualizando..." : ""}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          <Input
            value={form.sku}
            onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
            placeholder="SKU"
          />
          <Input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nombre"
          />
          <Input
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            placeholder="Categoría"
          />

          <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as Item["type"] }))}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FINISHED">Producto terminado (FINISHED)</SelectItem>
              <SelectItem value="COMPONENT">Componente (COMPONENT)</SelectItem>
              <SelectItem value="SERVICE">Servicio (SERVICE)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={form.uom} onValueChange={(v) => setForm((p) => ({ ...p, uom: v as Item["uom"] }))}>
            <SelectTrigger>
              <SelectValue placeholder="UOM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UN">UN</SelectItem>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="M2">M2</SelectItem>
              <SelectItem value="KG">KG</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => createMutation.mutate()} disabled={!form.sku || !form.name || createMutation.isPending}>
            {createMutation.isPending ? "Creando..." : "Crear"}
          </Button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>UOM</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((i) => (
                <TableRow key={i._id}>
                  <TableCell className="font-medium">{i.sku}</TableCell>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell>{i.type}</TableCell>
                  <TableCell>{i.uom}</TableCell>
                </TableRow>
              ))}

              {(data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Sin resultados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
