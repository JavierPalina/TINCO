"use client";

import React, { useEffect, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Filter, CalendarIcon, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Label } from "../ui/label";
import { useSucursales } from "@/features/sucursales/sucursales.queries";

interface User {
  _id: string;
  name: string;
  role?: string;
}

type EtapaLite = { _id: string; nombre: string };
type SucursalLite = { _id: string; nombre: string };

export interface Filters {
  searchTerm: string;
  vendedorId: string;   // "" => todas
  sucursalId: string;   // "" => todas
  etapaId: string;      // "" => todas
  dateRange: DateRange | undefined;
}

type Props = {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  etapas: EtapaLite[];
};

function setOrDelete(params: URLSearchParams, key: string, value?: string) {
  const v = (value ?? "").trim();
  if (!v) params.delete(key);
  else params.set(key, v);
}

function parseDateParam(v: string | null): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : undefined;
}

function isoDateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function QuotesPipelineFilters({ filters, setFilters, etapas }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const sp = useSearchParams();

  const sessionUserId = (session?.user?.id as string | undefined) || "";
  const sessionRole = (session?.user as any)?.role as string | undefined;

  // Vendedores (si tu endpoint devuelve solo vendedores, ok)
  const { data: vendedores } = useQuery<User[]>({
    queryKey: ["users", "vendedores"],
    queryFn: async () =>
      (await axios.get("/api/users", { params: { role: "vendedor" } })).data.data,
  });

  // Sucursales
  const { data: sucursales = [] } = useSucursales();

  const sucursalNameById = useMemo(() => {
    const m = new Map<string, string>();
    (sucursales as SucursalLite[]).forEach((s) => m.set(s._id, s.nombre));
    return m;
  }, [sucursales]);

  const etapaNameById = useMemo(() => {
    const m = new Map<string, string>();
    etapas.forEach((e) => m.set(e._id, e.nombre));
    return m;
  }, [etapas]);

  // URL -> State
  useEffect(() => {
    const urlSearch = sp.get("search");
    const urlVendedorId = sp.get("vendedorId");
    const urlSucursalId = sp.get("sucursalId");
    const urlEtapaId = sp.get("etapaId");
    const from = parseDateParam(sp.get("from"));
    const to = parseDateParam(sp.get("to"));

    const hasAny =
      urlSearch !== null ||
      urlVendedorId !== null ||
      urlSucursalId !== null ||
      urlEtapaId !== null ||
      from !== undefined ||
      to !== undefined;

    if (!hasAny) return;

    setFilters((prev) => ({
      ...prev,
      searchTerm: urlSearch ?? prev.searchTerm ?? "",
      vendedorId: urlVendedorId ?? prev.vendedorId ?? "",
      sucursalId: urlSucursalId ?? prev.sucursalId ?? "",
      etapaId: urlEtapaId ?? prev.etapaId ?? "",
      dateRange:
        from || to
          ? {
              from,
              to,
            }
          : undefined,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  // State -> URL
  useEffect(() => {
    const params = new URLSearchParams(sp.toString());

    setOrDelete(params, "search", filters.searchTerm);
    setOrDelete(params, "vendedorId", filters.vendedorId);
    setOrDelete(params, "sucursalId", filters.sucursalId);
    setOrDelete(params, "etapaId", filters.etapaId);

    if (filters.dateRange?.from) params.set("from", isoDateOnly(filters.dateRange.from));
    else params.delete("from");

    if (filters.dateRange?.to) params.set("to", isoDateOnly(filters.dateRange.to));
    else params.delete("to");

    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filters.searchTerm,
    filters.vendedorId,
    filters.sucursalId,
    filters.etapaId,
    filters.dateRange?.from,
    filters.dateRange?.to,
  ]);

  const handleFilterChange = <K extends keyof Filters>(name: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    // Para admin, limpiar = ver todo (vendedorId vacío).
    // Para vendedor, limpiar = mis cotizaciones.
    const defaultVendedor =
      sessionRole === "admin" ? "" : sessionUserId;

    setFilters({
      searchTerm: "",
      vendedorId: defaultVendedor,
      sucursalId: "",
      etapaId: "",
      dateRange: undefined,
    });
  };

  const activeFilterCount = useMemo(() => {
    const defaultVendedor =
      sessionRole === "admin" ? "" : sessionUserId;

    const isVendedorActive = filters.vendedorId !== defaultVendedor;
    const isDateActive = !!filters.dateRange?.from;
    const isSucursalActive = !!filters.sucursalId;
    const isEtapaActive = !!filters.etapaId;

    return (
      (isVendedorActive ? 1 : 0) +
      (isDateActive ? 1 : 0) +
      (isSucursalActive ? 1 : 0) +
      (isEtapaActive ? 1 : 0)
    );
  }, [filters, sessionRole, sessionUserId]);

  const vendedorName = useMemo(() => {
    if (!filters.vendedorId) return "Todas";
    return vendedores?.find((v) => v._id === filters.vendedorId)?.name || "Otro";
  }, [filters.vendedorId, vendedores]);

  const sucursalName = useMemo(() => {
    if (!filters.sucursalId) return "";
    return sucursalNameById.get(filters.sucursalId) || "Sucursal";
  }, [filters.sucursalId, sucursalNameById]);

  const etapaName = useMemo(() => {
    if (!filters.etapaId) return "";
    return etapaNameById.get(filters.etapaId) || "Etapa";
  }, [filters.etapaId, etapaNameById]);

  return (
    <div className="flex items-center gap-4 mb-4 px-4 mt-4">
      <div className="flex-grow">
        <Input
          placeholder="Buscar por cliente o código..."
          value={filters.searchTerm}
          onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* vendedor badge sólo si no es el default */}
        {activeFilterCount > 0 && filters.vendedorId && (
          <Badge className="pl-2 pr-1 h-6 bg-primary">
            <span className="mr-1">Vendedor: {vendedorName}</span>
            <button
              onClick={() => handleFilterChange("vendedorId", "")}
              className="rounded-full hover:bg-background/80 p-2"
              aria-label="Quitar filtro de vendedor"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {!!filters.sucursalId && (
          <Badge className="pl-2 pr-1 h-6 bg-primary">
            <span className="mr-1">Sucursal: {sucursalName}</span>
            <button
              onClick={() => handleFilterChange("sucursalId", "")}
              className="rounded-full hover:bg-background/80 p-2"
              aria-label="Quitar filtro de sucursal"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {!!filters.etapaId && (
          <Badge className="pl-2 pr-1 h-6 bg-primary">
            <span className="mr-1">Etapa: {etapaName}</span>
            <button
              onClick={() => handleFilterChange("etapaId", "")}
              className="rounded-full hover:bg-background/80 p-2"
              aria-label="Quitar filtro de etapa"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}

        {filters.dateRange?.from && (
          <Badge className="pl-2 pr-1 h-6 bg-primary">
            <span className="mr-1">
              {format(filters.dateRange.from, "d/MM", { locale: es })}
              {filters.dateRange.to && ` - ${format(filters.dateRange.to, "d/MM", { locale: es })}`}
            </span>
            <button
              onClick={() => handleFilterChange("dateRange", undefined)}
              className="rounded-full hover:bg-background/80 p-0.5"
              aria-label="Quitar filtro de fecha"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
      </div>

      {/* Popover filtros */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative flex-shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border-2 border-background">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filtros Adicionales</h4>
              <p className="text-sm text-muted-foreground">Refina tu búsqueda de negocios.</p>
            </div>

            <div className="grid gap-4">
              {/* Vendedor */}
              <div className="space-y-2">
                <Label>Vendedor</Label>
                <Select
                  value={filters.vendedorId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("vendedorId", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por vendedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>

                    {/* Si querés “Mis Cotizaciones” para todos */}
                    {sessionUserId && (
                      <SelectItem value={sessionUserId}>Mis Cotizaciones</SelectItem>
                    )}

                    {vendedores
                      ?.filter((v) => v._id !== sessionUserId)
                      .map((v) => (
                        <SelectItem key={v._id} value={v._id}>
                          {v.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sucursal */}
              <div className="space-y-2">
                <Label>Sucursal</Label>
                <Select
                  value={filters.sucursalId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("sucursalId", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {(sucursales as SucursalLite[]).map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Etapa */}
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select
                  value={filters.etapaId || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("etapaId", value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por etapa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {etapas.map((e) => (
                      <SelectItem key={e._id} value={e._id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rango fechas */}
              <div className="space-y-2">
                <Label>Rango de Fechas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "d LLL, y", { locale: es })} -{" "}
                            {format(filters.dateRange.to, "d LLL, y", { locale: es })}
                          </>
                        ) : (
                          format(filters.dateRange.from, "d LLL, y", { locale: es })
                        )
                      ) : (
                        <span>Seleccionar rango</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="range"
                      selected={filters.dateRange}
                      onSelect={(range) => handleFilterChange("dateRange", range)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button variant="ghost" onClick={clearFilters} className="mt-2 w-full">
              <X className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}