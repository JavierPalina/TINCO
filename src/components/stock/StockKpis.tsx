"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Boxes, PackageCheck, PackageX } from "lucide-react";

export function StockKpis({
  totalSkus,
  totalOnHand,
  totalReserved,
  totalAvailable,
}: {
  totalSkus: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
}) {
  const kpis = [
    { label: "SKUs", value: totalSkus, icon: Boxes },
    { label: "Físico (On Hand)", value: totalOnHand, icon: PackageCheck },
    { label: "Reservado", value: totalReserved, icon: PackageX },
    { label: "Disponible", value: totalAvailable, icon: PackageCheck },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <Card key={k.label}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-lg font-semibold">{k.value.toLocaleString("es-AR")}</div>
            </div>
            <k.icon className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
