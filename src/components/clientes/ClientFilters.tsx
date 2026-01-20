"use client";

import * as React from "react";
import { Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ClientFiltersProps = {
  filters: {
    searchTerm: string;
    etapa: string;
    prioridad: string;
    sucursalId?: string; // ✅ nuevo
  };
  onFilterChange: (name: string, value: string) => void;
  prioridadesUnicas: string[];

  // ✅ nuevos (opcionales, para no romper uso en otros lados)
  allowSucursalFilter?: boolean;
  sucursalesOptions?: Array<{ _id: string; nombre?: string }>;
  loadingSucursales?: boolean;
};

export function ClientFilters({
  filters,
  onFilterChange,
  prioridadesUnicas,
  allowSucursalFilter = false,
  sucursalesOptions = [],
  loadingSucursales = false,
}: ClientFiltersProps) {
  const hasExtra =
    Boolean(filters.etapa) ||
    Boolean(filters.prioridad) ||
    (allowSucursalFilter && Boolean(filters.sucursalId));

  return (
    <div className="flex items-end justify-between gap-3 mt-3 flex-wrap">
      <div className="grid gap-1 w-full md:max-w-md">
        <label className="text-sm font-medium">Buscar</label>
        <input
          value={filters.searchTerm}
          onChange={(e) => onFilterChange("searchTerm", e.target.value)}
          placeholder="Buscar por nombre, email, teléfono..."
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={hasExtra ? "default" : "outline"} className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80 p-3">
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Filtros Adicionales</div>
              <div className="text-xs text-muted-foreground">
                Refina tu búsqueda de clientes.
              </div>
            </div>

            {/* ✅ Sucursal dentro del dropdown (si está habilitado) */}
            {allowSucursalFilter && (
              <div className="grid gap-1">
                <label className="text-sm font-medium">Sucursal</label>
                <select
                  value={filters.sucursalId || ""}
                  onChange={(e) => onFilterChange("sucursalId", e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  disabled={loadingSucursales}
                >
                  {sucursalesOptions.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.nombre || s._id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid gap-1">
              <label className="text-sm font-medium">Etapa</label>
              <select
                value={filters.etapa}
                onChange={(e) => onFilterChange("etapa", e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Contactado">Contactado</option>
                <option value="Cotizado">Cotizado</option>
                <option value="Negociación">Negociación</option>
                <option value="Ganado">Ganado</option>
                <option value="Perdido">Perdido</option>
              </select>
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Prioridad</label>
              <select
                value={filters.prioridad}
                onChange={(e) => onFilterChange("prioridad", e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                {prioridadesUnicas.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  onFilterChange("etapa", "");
                  onFilterChange("prioridad", "");
                  // sucursal: si querés, no la limpiamos acá (se decide en la pantalla).
                }}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
