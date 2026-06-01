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

type TallerForm = {
  estadoInterno: string;
  numeroOrdenTaller: string;
  clienteObraEmpresa: string;
  fechaIngreso: string;
  fechaEstimadaFinalizacion: string;
  tipoAbertura: string;
  materialPerfil: string;
  tipoPerfil: string;
  color: string;
  vidrioAColocar: string;
  accesoriosCompletos: string;
  materialDisponible: string;
  materialObs: string;
  medidasVerificadas: string;
  planosVerificados: string;
  informeTaller: string;
  pedidoListoParaEntrega: string;
  destinoFinal: string;
};

function toDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function EditTallerSheet({ proyecto, onSaved }: { proyecto: ProyectoDTO; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const t = (proyecto.taller ?? {}) as Record<string, unknown>;

  const { register, handleSubmit, control, reset } = useForm<TallerForm>({
    defaultValues: {
      estadoInterno: String(t.estadoInterno ?? ""),
      numeroOrdenTaller: String(t.numeroOrdenTaller ?? ""),
      clienteObraEmpresa: String(t.clienteObraEmpresa ?? ""),
      fechaIngreso: toDate(t.fechaIngreso),
      fechaEstimadaFinalizacion: toDate(t.fechaEstimadaFinalizacion),
      tipoAbertura: String(t.tipoAbertura ?? ""),
      materialPerfil: String(t.materialPerfil ?? ""),
      tipoPerfil: String(t.tipoPerfil ?? ""),
      color: String(t.color ?? ""),
      vidrioAColocar: String(t.vidrioAColocar ?? ""),
      accesoriosCompletos: String(t.accesoriosCompletos ?? ""),
      materialDisponible: String(t.materialDisponible ?? ""),
      materialObs: String(t.materialObs ?? ""),
      medidasVerificadas: String(t.medidasVerificadas ?? ""),
      planosVerificados: String(t.planosVerificados ?? ""),
      informeTaller: String(t.informeTaller ?? ""),
      pedidoListoParaEntrega: String(t.pedidoListoParaEntrega ?? ""),
      destinoFinal: String(t.destinoFinal ?? ""),
    },
  });

  const onSubmit = async (data: TallerForm) => {
    setSaving(true);
    try {
      await axios.put(`/api/proyectos/${proyecto._id}`, { datosFormulario: { taller: data } });
      toast.success("Taller actualizado");
      qc.invalidateQueries({ queryKey: ["proyecto", String(proyecto._id)] });
      setOpen(false);
      onSaved?.();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const Sel = ({ name, label, opts }: { name: keyof TallerForm; label: string; opts: string[] }) => (
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
        <SheetHeader className="mb-4"><SheetTitle>Editar Taller</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-10">

          <div className="grid grid-cols-2 gap-3">
            <Sel name="estadoInterno" label="Estado interno" opts={["En proceso", "Completo", "En espera", "Revisión", "Rechazado"]} />
            <div className="space-y-1"><Label>N° orden taller</Label><Input {...register("numeroOrdenTaller")} /></div>
          </div>

          <div className="space-y-1"><Label>Cliente / Obra / Empresa</Label><Input {...register("clienteObraEmpresa")} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Fecha ingreso</Label><Input type="date" {...register("fechaIngreso")} /></div>
            <div className="space-y-1"><Label>Fecha est. finalización</Label><Input type="date" {...register("fechaEstimadaFinalizacion")} /></div>
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Especificaciones</p>

          <div className="space-y-1"><Label>Tipo de abertura</Label><Input {...register("tipoAbertura")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <Sel name="materialPerfil" label="Material perfil" opts={["Aluminio", "PVC", "Mixto", "Otro"]} />
            <div className="space-y-1"><Label>Tipo perfil</Label><Input {...register("tipoPerfil")} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Color</Label><Input {...register("color")} /></div>
            <div className="space-y-1"><Label>Vidrio a colocar</Label><Input {...register("vidrioAColocar")} /></div>
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Control de materiales</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Accesorios completos</Label><Input {...register("accesoriosCompletos")} placeholder="Sí / No / Parcial" /></div>
            <div className="space-y-1"><Label>Material disponible</Label><Input {...register("materialDisponible")} placeholder="Completo / Parcial..." /></div>
          </div>
          <div className="space-y-1"><Label>Observaciones material</Label><Textarea {...register("materialObs")} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Medidas verificadas</Label><Input {...register("medidasVerificadas")} /></div>
            <div className="space-y-1"><Label>Planos verificados</Label><Input {...register("planosVerificados")} /></div>
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cierre y despacho</p>

          <div className="space-y-1"><Label>Informe de taller</Label><Textarea {...register("informeTaller")} rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <Sel name="pedidoListoParaEntrega" label="Pedido listo para entrega" opts={["Sí", "No", "En revisión"]} />
            <Sel name="destinoFinal" label="Destino final" opts={["Depósito", "Logística", "Instalación en obra", "Retiro por cliente"]} />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
