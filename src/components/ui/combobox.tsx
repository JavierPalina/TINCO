"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchText?: string;
}

export function Combobox({ options, value, onChange, placeholder, emptyText, searchText }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const displayValue = options.find((option) => option.value.toLowerCase() === value?.toLowerCase())?.label || value;

  // --- ESTA ES LA NUEVA FUNCIÓN ---
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      // Previene que se envíe el formulario principal al presionar Enter
      event.preventDefault();
      // Cierra el popover
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {displayValue || (placeholder || "Selecciona una opción...")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder={searchText || "Buscar o crear..."}
            value={value || ''}
            onValueChange={onChange}
            // --- Y AQUÍ LA APLICAMOS ---
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            <CommandEmpty className="p-2 text-center text-sm" style={{maxWidth: "317px"}}>
              {emptyText || "No se encontró. Presiona Enter para usar este valor."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onChange(option.value === value ? "" : option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
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
  )
}