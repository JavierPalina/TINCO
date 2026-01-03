"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Movement = {
  _id: string;
  type: string;
  itemId: { sku: string; name: string };
  warehouseId: { name: string };
  qty: number;
  uom: string;
  note?: string;
  createdAt: string;
  ref?: { kind?: string; id?: string };
};

export function MovementsTable() {
  const [warehouseId, setWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");

  const queryKey = useMemo(() => ["movements", warehouseId, itemId], [warehouseId, itemId]);

  const { data, isFetching } = useQuery<Movement[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get("/api/stock/movements", { params: { warehouseId, itemId } });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Input value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="warehouseId (opcional)" />
          <Input value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="itemId (opcional)" />
          <div className="text-xs text-muted-foreground">{isFetching ? "Actualizando..." : ""}</div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((m) => (
                <TableRow key={m._id}>
                  <TableCell>{new Date(m.createdAt).toLocaleString("es-AR")}</TableCell>
                  <TableCell className="font-medium">{m.type}</TableCell>
                  <TableCell>{m.itemId?.sku ?? "-"}</TableCell>
                  <TableCell>{m.itemId?.name ?? "-"}</TableCell>
                  <TableCell>{m.warehouseId?.name ?? "-"}</TableCell>
                  <TableCell className="text-right">{m.qty} {m.uom}</TableCell>
                  <TableCell>{m.ref?.kind ? `${m.ref.kind}:${m.ref.id}` : "-"}</TableCell>
                  <TableCell className="max-w-[320px] truncate">{m.note ?? "-"}</TableCell>
                </TableRow>
              ))}
              {(data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    Sin movimientos
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
