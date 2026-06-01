"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Boxes, PackageCheck, BookmarkCheck, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const KPIS = [
  {
    key: "skus",
    label: "SKUs distintos",
    icon: Boxes,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    tooltip: "Cantidad de productos/materiales distintos con saldo en este depósito.",
  },
  {
    key: "onHand",
    label: "Físico (en depósito)",
    icon: PackageCheck,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    tooltip: "Unidades físicamente presentes en el depósito. Incluye lo que está reservado para proyectos.",
  },
  {
    key: "reserved",
    label: "Reservado",
    icon: BookmarkCheck,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    tooltip: "Material apartado para proyectos activos. No está disponible para otros usos hasta que se libere o consuma.",
  },
  {
    key: "available",
    label: "Disponible",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/5",
    tooltip: "Disponible = Físico − Reservado. Es lo que podés usar hoy para nuevos proyectos o ventas.",
  },
];

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
  const values: Record<string, number> = {
    skus: totalSkus,
    onHand: totalOnHand,
    reserved: totalReserved,
    available: totalAvailable,
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => {
          const value = values[k.key];
          const isLow = k.key === "available" && value <= 0;
          return (
            <Card key={k.key} className={cn(isLow && "border-destructive/40")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", k.bg)}>
                    <k.icon className={cn("h-4 w-4", isLow ? "text-destructive" : k.color)} />
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {k.tooltip}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="mt-3">
                  <div className={cn("text-2xl font-bold tabular-nums", isLow && "text-destructive")}>
                    {value.toLocaleString("es-AR")}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
                  {isLow && (
                    <div className="text-xs text-destructive mt-1">Sin stock libre</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
