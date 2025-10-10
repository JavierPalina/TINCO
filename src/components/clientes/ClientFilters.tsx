"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";

type Filters = {
  searchTerm: string;
  etapa: string;
  prioridad: string;
};

type Props = {
  filters: Filters;
  onFilterChange: (name: keyof Filters, value: string) => void;
  prioridadesUnicas: string[];
}

export function ClientFilters({ filters, onFilterChange, prioridadesUnicas }: Props) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-grow">
        <Input 
            placeholder="Buscar por nombre, email, teléfono..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            className="max-w-sm"
        />
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filtros Adicionales</h4>
              <p className="text-sm text-muted-foreground">
                Refina tu búsqueda de clientes.
              </p>
            </div>
            <div className="grid gap-2">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="etapa">Etapa</Label>
                <Select value={filters.etapa} onValueChange={(value) => onFilterChange('etapa', value === 'all' ? '' : value)}>
                    <SelectTrigger className="col-span-2"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="Nuevo">Nuevo</SelectItem>
                        <SelectItem value="Contactado">Contactado</SelectItem>
                        <SelectItem value="Cotizado">Cotizado</SelectItem>
                        <SelectItem value="Negociación">Negociación</SelectItem>
                        <SelectItem value="Ganado">Ganado</SelectItem>
                        <SelectItem value="Perdido">Perdido</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select value={filters.prioridad} onValueChange={(value) => onFilterChange('prioridad', value === 'all' ? '' : value)}>
                    <SelectTrigger className="col-span-2"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {prioridadesUnicas?.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}