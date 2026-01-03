"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Package, Boxes, ArrowRightLeft, ClipboardList, Layers } from "lucide-react";

const nav = [
  { href: "/dashboard/stock/balances", label: "Balances", icon: Boxes, desc: "Disponible / Reservado / Físico" },
  { href: "/dashboard/stock/movements", label: "Movimientos", icon: ArrowRightLeft, desc: "Ingresos, egresos, ajustes" },
  { href: "/dashboard/stock/reservations", label: "Reservas", icon: ClipboardList, desc: "Reservar y liberar stock" },
  { href: "/dashboard/stock/boms", label: "BOM (Kits)", icon: Layers, desc: "Recetas por SKU" },
  { href: "/dashboard/stock/items", label: "Items (SKU)", icon: Package, desc: "Catálogo y atributos" },
];

export function StockShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="px-4 md:px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="border rounded-xl bg-card p-3 h-fit lg:sticky lg:top-20">
          <div className="px-2 py-2">
            <div className="text-sm font-semibold">Stock / Depósito</div>
            <div className="text-xs text-muted-foreground">Gestión operativa</div>
          </div>

          <nav className="mt-2 space-y-1">
            {nav.map((it) => {
              const active = pathname?.startsWith(it.href);
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-2 transition-colors",
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                  )}
                >
                  <Icon className={cn("h-4 w-4 mt-0.5", active ? "text-primary-foreground" : "text-muted-foreground")} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{it.label}</div>
                    <div className={cn("text-xs truncate", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {it.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
