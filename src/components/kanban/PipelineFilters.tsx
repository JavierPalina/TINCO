"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";

type Filters = {
  searchTerm: string;
  prioridad: string;
};

type Props = {
  filters: Filters;
  onFilterChange: (name: keyof Filters, value: string) => void;
  prioridadesUnicas: string[];
}

export function PipelineFilters({ filters, onFilterChange, prioridadesUnicas }: Props) {
  return (
    <div className="flex items-center gap-4 mb-4 px-4">
      <div className="flex-grow">
        <Input 
            placeholder="Buscar cliente en el pipeline..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
        />
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Prioridad</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Filtrar por Prioridad</h4>
            </div>
            <Select value={filters.prioridad} onValueChange={(value) => onFilterChange('prioridad', value === 'all' ? '' : value)}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {prioridadesUnicas?.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}