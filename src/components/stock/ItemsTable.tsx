"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Item = {
  _id: string;
  type: "FINISHED" | "COMPONENT" | "SERVICE";
  sku: string;
  name: string;
  category: string;
  uom: "UN" | "M" | "M2" | "KG";
  active: boolean;
};

export function ItemsTable() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    type: "COMPONENT" as Item["type"],
    sku: "",
    name: "",
    category: "Perfil",
    uom: "UN" as Item["uom"],
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
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error creando item"),
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
          <Input
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as any }))}
            placeholder="Tipo (FINISHED/COMPONENT/SERVICE)"
          />
          <div className="flex gap-2">
            <Input
              value={form.uom}
              onChange={(e) => setForm((p) => ({ ...p, uom: e.target.value as any }))}
              placeholder="UOM (UN/M/M2/KG)"
            />
            <Button onClick={() => createMutation.mutate()} disabled={!form.sku || !form.name || createMutation.isPending}>
              Crear
            </Button>
          </div>
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
