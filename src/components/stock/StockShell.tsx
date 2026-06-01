"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Package, Boxes, ArrowRightLeft, ClipboardList, Layers,
  HelpCircle,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

const nav = [
  {
    href: "/dashboard/stock/balances",
    label: "Balances",
    icon: Boxes,
    desc: "Stock real por ítem y depósito",
    help: "Ver cuánto hay en depósito, cuánto está reservado para proyectos y cuánto podés usar hoy.",
  },
  {
    href: "/dashboard/stock/movements",
    label: "Movimientos",
    icon: ArrowRightLeft,
    desc: "Ingresos, egresos y ajustes",
    help: "Historial completo de cambios de inventario: compras de perfiles, consumo en proyectos, transferencias entre depósitos.",
  },
  {
    href: "/dashboard/stock/reservations",
    label: "Reservas",
    icon: ClipboardList,
    desc: "Material apartado por proyecto",
    help: "Reservá materiales para proyectos antes de fabricar, así asegurás que no se usen en otro lugar.",
  },
  {
    href: "/dashboard/stock/boms",
    label: "BOM (Kits)",
    icon: Layers,
    desc: "Recetas por ventana o puerta",
    help: "Define qué perfiles, vidrios y herrajes necesitás para fabricar cada tipo de abertura. Se usa en Producción.",
  },
  {
    href: "/dashboard/stock/items",
    label: "Catálogo (SKU)",
    icon: Package,
    desc: "Perfiles, vidrios, herrajes...",
    help: "Catálogo maestro de todos los materiales y productos. Cada ítem tiene SKU, tipo y unidad de medida.",
  },
];

export function StockShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="px-4 md:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="border rounded-xl bg-card p-3 h-fit lg:sticky lg:top-20">
            <div className="px-2 py-2 border-b mb-2">
              <div className="text-sm font-semibold">Stock / Depósito</div>
              <div className="text-xs text-muted-foreground">Gestión de inventario y materiales</div>
            </div>

            <nav className="space-y-1">
              {nav.map((it) => {
                const active = pathname?.startsWith(it.href);
                const Icon = it.icon;
                return (
                  <div key={it.href} className="flex items-center gap-1">
                    <Link
                      href={it.href}
                      className={cn(
                        "flex items-start gap-3 rounded-lg px-3 py-2 transition-colors flex-1 min-w-0",
                        active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{it.label}</div>
                        <div className={cn("text-xs truncate", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {it.desc}
                        </div>
                      </div>
                    </Link>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[220px] text-xs">
                        {it.help}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </nav>

            {/* Quick reference */}
            <div className="mt-4 mx-2 rounded-lg bg-muted/50 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">Fórmula clave</p>
              <p className="text-xs">
                <span className="font-semibold text-green-600 dark:text-green-400">Disponible</span>
                {" = "}
                <span className="font-semibold">Físico</span>
                {" − "}
                <span className="font-semibold text-amber-600 dark:text-amber-400">Reservado</span>
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Lo que reservás para un proyecto no afecta el físico, pero sí reduce el disponible.
              </p>
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
