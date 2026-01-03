"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type Chip = { key: string; label: string; value: string; onRemove: () => void };

export function FilterChipsBar({
  chips,
  onClearAll,
}: {
  chips: Chip[];
  onClearAll?: () => void;
}) {
  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-xs text-muted-foreground">Filtros:</div>
      {chips.map((c) => (
        <Badge key={c.key} variant="secondary" className="gap-2">
          <span className="text-xs">
            {c.label}: <span className="font-semibold">{c.value}</span>
          </span>
          <button type="button" onClick={c.onRemove} className="hover:opacity-80">
            <X className="h-3.5 w-3.5" />
          </button>
        </Badge>
      ))}

      {onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs">
          Limpiar todo
        </Button>
      )}
    </div>
  );
}
