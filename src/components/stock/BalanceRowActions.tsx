"use client";

import { useState } from "react";
import { MoreVertical, ArrowRightLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MovementDialog } from "@/components/stock/MovementDialog";
import { ReserveDialog } from "@/components/stock/ReserveDialog";

/**
 * Nota: Para precarga real, necesitás que MovementDialog/ReserveDialog acepten props opcionales
 * defaultItemId / defaultWarehouseId. Abajo te dejo el ajuste mínimo en esos dialogs.
 */

export function BalanceRowActions({
  itemId,
  warehouseId,
}: {
  itemId: string;
  warehouseId: string;
}) {
  const [openMove, setOpenMove] = useState(false);
  const [openReserve, setOpenReserve] = useState(false);

  return (
    <>
      <MovementDialog
        open={openMove}
        onOpenChange={setOpenMove}
        defaults={{ itemId, warehouseId, type: "IN" }}
      />
      <ReserveDialog
        open={openReserve}
        onOpenChange={setOpenReserve}
        defaults={{ warehouseId, lines: [{ itemId, qty: "1" }] }}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem onSelect={() => setOpenMove(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Nuevo movimiento
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenReserve(true)}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Reservar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
