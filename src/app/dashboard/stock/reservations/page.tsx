import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { ReservationsTable } from "@/components/stock/ReservationsTable";
import { ReserveDialog } from "@/components/stock/ReserveDialog";

export default function StockReservationsPage() {
  return (
    <div className="space-y-4">
      <StockPageHeader
        title="Reservas"
        description="Reservas de stock por referencia (proyecto/cotización). Afectan el reservado y el disponible."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock", href: "/dashboard/stock/balances" },
          { label: "Reservas" },
        ]}
        actions={<ReserveDialog />}
      />

      <ReservationsTable />
    </div>
  );
}
