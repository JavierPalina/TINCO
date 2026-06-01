import { StockPageHeader } from "@/components/stock/StockPageHeader";
import { BomEditor } from "@/components/stock/BomEditor";
import { Info, Layers, ArrowRight } from "lucide-react";

export default function StockBomsPage() {
  return (
    <div className="space-y-4">
      <StockPageHeader
        title="BOM — Recetas de fabricación"
        description="Define qué materiales y en qué cantidad se necesitan para fabricar cada producto terminado. La BOM activa se usa automáticamente en Producción."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Stock", href: "/dashboard/stock/balances" },
          { label: "BOM (Kits)" },
        ]}
      />

      {/* What is a BOM */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">¿Qué es una BOM?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Una <strong>BOM (Bill of Materials)</strong> es la receta de fabricación de un producto terminado.
              Le dice al sistema cuánto de cada material se consume al producir una unidad.
              Cuando registrás una <strong>Producción</strong> en Movimientos, el sistema descuenta automáticamente los componentes según la BOM activa.
            </p>
          </div>
        </div>

        {/* Example for aberturas */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ejemplo: Ventana Corrediza 150×100 cm</p>
          <div className="space-y-2">
            {[
              { mat: "Perfil guía inferior A30", qty: "1.50", uom: "M", type: "Materia prima" },
              { mat: "Perfil marco lateral", qty: "2.00", uom: "M", type: "Materia prima" },
              { mat: "Vidrio DVH 4+16+4", qty: "1", uom: "UN", type: "Materia prima" },
              { mat: "Herraje cerradura corrediza", qty: "1", uom: "UN", type: "Componente" },
              { mat: "Rueditas de nylon", qty: "4", uom: "UN", type: "Componente" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="flex-1 font-medium">{r.mat}</div>
                <div className="tabular-nums text-muted-foreground">{r.qty} {r.uom}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{r.type}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <ArrowRight className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              Al registrar <strong>1 Producción</strong> de esta BOM, el stock descuenta exactamente esas cantidades.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
          <span>
            Podés crear múltiples versiones de una BOM. Solo la versión <strong>activa</strong> se usa en Producción.
            Esto es útil cuando cambiás de proveedor o actualizás el diseño de una abertura.
          </span>
        </div>
      </div>

      <BomEditor />
    </div>
  );
}
