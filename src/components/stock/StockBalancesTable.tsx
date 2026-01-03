"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BalanceRow = {
  _id: string;
  item: { _id: string; sku: string; name: string; category: string; uom: string };
  warehouse: { _id: string; name: string };
  location?: { _id: string; code: string } | null;
  onHand: number;
  reserved: number;
  available: number;
  updatedAt: string;
};

export function StockBalancesTable() {
  const [warehouseId, setWarehouseId] = useState("");
  const [itemId, setItemId] = useState("");

  const queryKey = useMemo(() => ["stockBalances", warehouseId, itemId], [warehouseId, itemId]);

  const { data, isFetching } = useQuery<BalanceRow[]>({
    queryKey,
    queryFn: async () => {
      const { data } = await axios.get("/api/stock/balances", { params: { warehouseId, itemId } });
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
                <TableHead>SKU</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Depósito</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-right">OnHand</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-medium">{r.item.sku}</TableCell>
                  <TableCell>{r.item.name}</TableCell>
                  <TableCell>{r.warehouse.name}</TableCell>
                  <TableCell>{r.location?.code ?? "-"}</TableCell>
                  <TableCell className="text-right">{r.onHand}</TableCell>
                  <TableCell className="text-right">{r.reserved}</TableCell>
                  <TableCell className="text-right font-semibold">{r.available}</TableCell>
                </TableRow>
              ))}
              {(data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Sin datos
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
