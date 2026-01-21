"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePrioridad } from "@/features/prioridades/prioridades.queries";

export function AddPrioridadDialog({
  onCreated,
}: {
  onCreated?: (p: { _id: string; nombre: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const create = useCreatePrioridad();

  const submit = async () => {
    const value = nombre.trim();
    if (!value) return toast.error("Ingresá un nombre de prioridad.");

    try {
      const p = await create.mutateAsync(value);
      toast.success(`Prioridad "${p.nombre}" creada.`);
      onCreated?.({ _id: p._id, nombre: p.nombre });
      setNombre("");
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la prioridad.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="shrink-0 whitespace-nowrap">
          Nueva Prioridad
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Crear Prioridad</DialogTitle>
          <DialogDescription>
            Se guardará en la base de datos y quedará disponible para todos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Nombre</Label>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
