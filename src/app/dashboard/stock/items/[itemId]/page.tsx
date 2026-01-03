"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Item = {
  _id: string;
  sku: string;
  name: string;
  type: string;
  uom: string;
  category: string;
  isActive: boolean;
  createdAt: string;
};

export default function StockItemDetailPage({ params }: { params: { itemId: string } }) {
  const { data, isLoading } = useQuery<Item>({
    queryKey: ["itemDetail", params.itemId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/items/${params.itemId}`);
      return data.data;
    },
  });

  const item = data;

  return (
    <div className="space-y-4">
      <StockPageHeader
        title={item ? `${item.sku} · ${item.name}` : "Item"}
        description="Detalle del SKU: atributos, balances, movimientos y BOM."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock", href: "/dashboard/stock/balances" },
          { label: "Items (SKU)", href: "/dashboard/stock/items" },
          { label: item?.sku ?? "Detalle" },
        ]}
      />

      <Card>
        <CardContent className="p-4">
          {isLoading || !item ? (
            <div className="text-sm text-muted-foreground">Cargando...</div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">SKU</div>
                <div className="text-xl font-semibold">{item.sku}</div>
                <div className="text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.category} · {item.type} · {item.uom}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={item.isActive ? "secondary" : "destructive"}>
                  {item.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="balances" className="space-y-3">
        <TabsList>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
          <TabsTrigger value="bom">BOM</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Implementación recomendada: llamar a <code>/api/stock/balances?itemId=...</code>.
              Si tu endpoint no soporta itemId todavía, lo agregás en 5 líneas del handler.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Implementación recomendada: llamar a <code>/api/stock/movements?itemId=...</code>.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bom">
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Implementación recomendada: si el SKU es FINISHED, mostrar su BOM activa.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
