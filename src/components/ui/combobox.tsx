"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchText?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  emptyText,
  searchText,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  // Estado SEPARADO para el input de búsqueda (clave para que no aparezca el ID)
  const [search, setSearch] = React.useState("");

  // Label visible en el botón (nunca debería mostrar el ID)
  const selectedLabel =
    options.find(
      (option) =>
        option.value?.toLowerCase?.() === value?.toLowerCase?.()
    )?.label ?? "";

  const displayValue = selectedLabel || "";

  // Al abrir: limpiá el buscador para que NO se precargue con el ID
  React.useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  // Para tu UX de "crear con Enter": si ya existe una opción exacta por label o por value, no "crea"
  const hasExactMatch = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return false;
    return options.some(
      (o) =>
        o.label.toLowerCase() === q || o.value.toLowerCase() === q
    );
  }, [options, search]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    // Previene submit del form
    event.preventDefault();

    const q = search.trim();
    if (!q) {
      setOpen(false);
      return;
    }

    // Si hay match exacto por label, selecciona esa opción
    const exactByLabel = options.find(
      (o) => o.label.toLowerCase() === q.toLowerCase()
    );
    if (exactByLabel) {
      onChange(exactByLabel.value);
      setOpen(false);
      return;
    }

    // Si hay match exacto por value, selecciona esa opción
    const exactByValue = options.find(
      (o) => o.value.toLowerCase() === q.toLowerCase()
    );
    if (exactByValue) {
      onChange(exactByValue.value);
      setOpen(false);
      return;
    }

    // Si no existe: "crear" usando el texto escrito (mantiene tu comportamiento)
    onChange(q);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {displayValue || placeholder || "Selecciona una opción..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchText || "Buscar o crear..."}
            value={search}
            onValueChange={setSearch}
            onKeyDown={handleKeyDown}
          />

          <CommandList>
            <CommandEmpty
              className="p-2 text-center text-sm"
              style={{ maxWidth: "317px" }}
            >
              {emptyText ||
                (hasExactMatch
                  ? "No hay resultados para ese filtro."
                  : "No se encontró. Presiona Enter para usar este valor.")}
            </CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  // Para que el filtro/búsqueda funcione por label (no por ID)
                  value={option.label}
                  onSelect={() => {
                    // Selecciona el value real (ID o string)
                    const nextValue = option.value === value ? "" : option.value;
                    onChange(nextValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase?.() === option.value.toLowerCase()
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
