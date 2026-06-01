import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { ReservationsTable } from "@/components/stock/ReservationsTable";
import { ReserveDialog } from "@/components/stock/ReserveDialog";
import { BookmarkCheck, CheckCircle2, XCircle, Info } from "lucide-react";

export default function StockReservationsPage() {
  return (
    <div className="space-y-4">
      <StockPageHeader
        title="Reservas de Material"
        description="Apartá materiales para proyectos activos antes de fabricar. Una reserva reduce el disponible sin afectar el físico. Se libera o consume cuando el proyecto avanza."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock", href: "/dashboard/stock/balances" },
          { label: "Reservas" },
        ]}
        actions={<ReserveDialog />}
      />

      {/* How reservations work */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            icon: BookmarkCheck,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
            step: "1. Reservar",
            desc: "Cuando un proyecto entra en Taller, reservás los perfiles, vidrios y herrajes necesarios. El disponible baja, el físico queda igual.",
          },
          {
            icon: CheckCircle2,
            color: "text-green-600 dark:text-green-400",
            bg: "bg-green-50 dark:bg-green-950/30",
            step: "2. Consumir",
            desc: "Al fabricar y entregar, registrás la Producción o Egreso. El físico baja y la reserva se marca como consumida.",
          },
          {
            icon: XCircle,
            color: "text-slate-500",
            bg: "bg-slate-50 dark:bg-slate-900/30",
            step: "3. Liberar",
            desc: "Si el proyecto se cancela o los materiales no se usan, liberás la reserva y el disponible vuelve a subir.",
          },
        ].map((s) => (
          <div key={s.step} className={`rounded-lg border p-4 flex items-start gap-3 ${s.bg}`}>
            <s.icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${s.color}`} />
            <div>
              <p className="text-sm font-semibold">{s.step}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
        <span>
          También podés reservar materiales directamente desde la etapa <strong>Taller</strong> del proyecto,
          usando el panel <em>"Materiales del Proyecto"</em> que aparece en esa vista.
          Las reservas ahí creadas quedan vinculadas automáticamente al proyecto.
        </span>
      </div>

      <ReservationsTable />
    </div>
  );
}
