"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ProyectoDTO } from "@/types/proyecto";

type DepForm = {
  estadoInterno: string;
  numeroOrdenDeposito: string;
  fechaIngresoDeposito: string;
  responsableRecepcion: string;
  origenPedido: string;
  estadoProductoRecibido: string;
  cantidadUnidades: string;
  ubicacionSeleccion: string;
  ubicacionTexto: string;
  codigoInterno: string;
  verificacionEmbalaje: string;
  materialAlmacenado: string;
  materialAlmacenadoObs: string;
  controlMedidasPiezas: string;
  condicionVidrio: string;
  fechaSalida: string;
  estadoActualPedido: string;
  observaciones: string;
};

function toDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function EditDepositoSheet({ proyecto, onSaved }: { proyecto: ProyectoDTO; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const dep = (proyecto.deposito ?? {}) as Record<string, unknown>;

  const { register, handleSubmit, control, reset } = useForm<DepForm>({
    defaultValues: {
      estadoInterno: String(dep.estadoInterno ?? ""),
      numeroOrdenDeposito: String(dep.numeroOrdenDeposito ?? ""),
      fechaIngresoDeposito: toDate(dep.fechaIngresoDeposito),
      responsableRecepcion: String(dep.responsableRecepcion ?? ""),
      origenPedido: String(dep.origenPedido ?? ""),
      estadoProductoRecibido: String(dep.estadoProductoRecibido ?? ""),
      cantidadUnidades: String(dep.cantidadUnidades ?? ""),
      ubicacionSeleccion: String(dep.ubicacionSeleccion ?? ""),
      ubicacionTexto: String(dep.ubicacionTexto ?? ""),
      codigoInterno: String(dep.codigoInterno ?? ""),
      verificacionEmbalaje: String(dep.verificacionEmbalaje ?? ""),
      materialAlmacenado: String(dep.materialAlmacenado ?? ""),
      materialAlmacenadoObs: String(dep.materialAlmacenadoObs ?? ""),
      controlMedidasPiezas: String(dep.controlMedidasPiezas ?? ""),
      condicionVidrio: String(dep.condicionVidrio ?? ""),
      fechaSalida: toDate(dep.fechaSalida),
      estadoActualPedido: String(dep.estadoActualPedido ?? ""),
      observaciones: String(dep.observaciones ?? ""),
    },
  });

  const onSubmit = async (data: DepForm) => {
    setSaving(true);
    try {
      await axios.put(`/api/proyectos/${proyecto._id}`, { datosFormulario: { deposito: data } });
      toast.success("Depósito actualizado");
      qc.invalidateQueries({ queryKey: ["proyecto", String(proyecto._id)] });
      setOpen(false);
      onSaved?.();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const Sel = ({ name, label, opts }: { name: keyof DepForm; label: string; opts: string[] }) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Controller control={control} name={name} render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>{opts.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
      )} />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) reset(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Pencil className="h-3.5 w-3.5" />Editar</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4"><SheetTitle>Editar Depósito</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-10">

          <div className="grid grid-cols-2 gap-3">
            <Sel name="estadoInterno" label="Estado interno" opts={["En depósito", "Listo para entrega", "En revisión", "Devolución"]} />
            <div className="space-y-1"><Label>N° orden depósito</Label><Input {...register("numeroOrdenDeposito")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Fecha ingreso</Label><Input type="date" {...register("fechaIngresoDeposito")} /></div>
            <div className="space-y-1"><Label>Responsable recepción</Label><Input {...register("responsableRecepcion")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Sel name="origenPedido" label="Origen pedido" opts={["Taller", "Proveedor", "Devolución", "Otro"]} />
            <div className="space-y-1"><Label>Cantidad unidades</Label><Input type="number" {...register("cantidadUnidades")} /></div>
          </div>
          <div className="space-y-1"><Label>Estado producto recibido</Label><Input {...register("estadoProductoRecibido")} /></div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Almacenamiento</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Ubicación</Label><Input {...register("ubicacionSeleccion")} placeholder="Sector, pasillo..." /></div>
            <div className="space-y-1"><Label>Detalle ubicación</Label><Input {...register("ubicacionTexto")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Código interno</Label><Input {...register("codigoInterno")} placeholder="Ej: A-03-12" /></div>
            <div className="space-y-1"><Label>Verificación embalaje</Label><Input {...register("verificacionEmbalaje")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Material almacenado</Label><Input {...register("materialAlmacenado")} /></div>
            <div className="space-y-1"><Label>Obs. material</Label><Input {...register("materialAlmacenadoObs")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Control medidas/piezas</Label><Input {...register("controlMedidasPiezas")} /></div>
            <div className="space-y-1"><Label>Condición vidrio</Label><Input {...register("condicionVidrio")} /></div>
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Salida</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Fecha salida</Label><Input type="date" {...register("fechaSalida")} /></div>
            <div className="space-y-1"><Label>Estado actual pedido</Label><Input {...register("estadoActualPedido")} /></div>
          </div>
          <div className="space-y-1"><Label>Observaciones</Label><Textarea {...register("observaciones")} rows={3} /></div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
