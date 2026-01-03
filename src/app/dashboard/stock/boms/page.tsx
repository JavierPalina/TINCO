import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { BomEditor } from "@/components/stock/BomEditor";

export default function StockBomsPage() {
  return (
    <div className="space-y-4">
      <StockPageHeader
        title="BOM (Kits)"
        description="Definición de materiales (Bill of Materials) por producto terminado. La BOM activa se usa para Producción."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock", href: "/dashboard/stock/balances" },
          { label: "BOM (Kits)" },
        ]}
      />
      <BomEditor />
    </div>
  );
}
