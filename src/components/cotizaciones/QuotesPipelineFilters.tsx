"use client";

import { useMemo } from "react"; // NUEVO: Importamos useMemo
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge"; // NUEVO: Importamos Badge
import { Filter, CalendarIcon, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from "../ui/label";

interface User { _id: string; name: string; }
export interface Filters {
    searchTerm: string;
    vendedorId: string;
    dateRange: DateRange | undefined;
}

type Props = {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

export function QuotesPipelineFilters({ filters, setFilters }: Props) {
    const { data: session } = useSession();
    const { data: vendedores } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => (await axios.get('/api/users')).data.data,
    });

    const handleFilterChange = <K extends keyof Filters>(
        name: K,
        value: Filters[K]
    ) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            searchTerm: '',
            vendedorId: session?.user?.id || '',
            dateRange: undefined
        });
    };

    // MODIFICADO: Lógica mejorada para contar filtros activos usando useMemo
    const activeFilterCount = useMemo(() => {
        const defaultVendedorId = session?.user?.id;
        if (!defaultVendedorId) return 0; // No calculamos hasta que la sesión esté lista

        const isVendedorActive = filters.vendedorId !== defaultVendedorId;
        const isDateActive = !!filters.dateRange?.from;

        return (isVendedorActive ? 1 : 0) + (isDateActive ? 1 : 0);
    }, [filters, session?.user?.id]);

    // NUEVO: Función para obtener el texto del filtro de vendedor para el badge
    const getVendedorFilterText = () => {
        if (filters.vendedorId === "") return "Todos";
        return vendedores?.find(v => v._id === filters.vendedorId)?.name || "Otro";
    };

    return (
        <div className="flex items-center gap-4 mb-4 px-4 mt-4">
            {/* Barra de Búsqueda (siempre visible) */}
            <div className="flex-grow">
                <Input 
                placeholder="Buscar por cliente o código..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="max-w-sm"
                /> 
            </div>

            {/* NUEVO: Indicadores de filtros activos como badges */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {filters.vendedorId !== (session?.user?.id) && session?.user?.id && (
                    <Badge className="pl-2 pr-1 h-6 bg-primary">
                        <span className="mr-1">Vendedor: {getVendedorFilterText()}</span>
                        <button 
                            onClick={() => handleFilterChange('vendedorId', session.user.id)}
                            className="rounded-full hover:bg-background/80 p-2"
                            aria-label="Quitar filtro de vendedor"
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
                            onClick={() => handleFilterChange('dateRange', undefined)}
                            className="rounded-full hover:bg-background/80 p-0.5"
                            aria-label="Quitar filtro de fecha"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
            </div>

            {/* Popover con Filtros Avanzados */}
            <Popover>
                <PopoverTrigger asChild>
                    {/* El badge de número se mantiene en el botón principal */}
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
                    {/* El contenido del popover no cambia */}
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Filtros Adicionales</h4>
                            <p className="text-sm text-muted-foreground">
                                Refina tu búsqueda de cotizaciones.
                            </p>
                        </div>
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label>Vendedor</Label>
                                <Select 
                                    value={filters.vendedorId} 
                                    onValueChange={(value) => handleFilterChange('vendedorId', value === 'all' ? '' : value)}
                                    defaultValue={session?.user?.id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filtrar por vendedor..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={session?.user?.id || ''}>Mis Cotizaciones</SelectItem>
                                        <SelectItem value="all">Todas</SelectItem> {/* Este se convierte en '' */}
                                        {vendedores?.filter(v => v._id !== session?.user?.id).map(v => (
                                            <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                                            onSelect={(range) => handleFilterChange('dateRange', range)}
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