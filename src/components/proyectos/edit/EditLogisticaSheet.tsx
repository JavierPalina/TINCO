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

type LogForm = {
  estadoEntrega: string;
  numeroOrdenLogistica: string;
  clienteObraEmpresa: string;
  direccionEntregaObra: string;
  fechaProgramadaEntrega: string;
  responsableLogistica: string;
  tipoEntrega: string;
  medioTransporte: string;
  estadoPedidoRecibidoTaller: string;
  verificacionEmbalaje: string;
  cantidadBultos: string;
  horaSalida: string;
  horaLlegada: string;
  responsableQueRecibe: string;
  informeLogistica: string;
  fechaCierreEntrega: string;
};

function toDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function EditLogisticaSheet({ proyecto, onSaved }: { proyecto: ProyectoDTO; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const lg = (proyecto.logistica ?? {}) as Record<string, unknown>;

  const { register, handleSubmit, control, reset } = useForm<LogForm>({
    defaultValues: {
      estadoEntrega: String(lg.estadoEntrega ?? ""),
      numeroOrdenLogistica: String(lg.numeroOrdenLogistica ?? ""),
      clienteObraEmpresa: String(lg.clienteObraEmpresa ?? ""),
      direccionEntregaObra: String(lg.direccionEntregaObra ?? ""),
      fechaProgramadaEntrega: toDate(lg.fechaProgramadaEntrega),
      responsableLogistica: String(lg.responsableLogistica ?? ""),
      tipoEntrega: String(lg.tipoEntrega ?? ""),
      medioTransporte: String(lg.medioTransporte ?? ""),
      estadoPedidoRecibidoTaller: String(lg.estadoPedidoRecibidoTaller ?? ""),
      verificacionEmbalaje: String(lg.verificacionEmbalaje ?? ""),
      cantidadBultos: String(lg.cantidadBultos ?? ""),
      horaSalida: String(lg.horaSalida ?? ""),
      horaLlegada: String(lg.horaLlegada ?? ""),
      responsableQueRecibe: String(lg.responsableQueRecibe ?? ""),
      informeLogistica: String(lg.informeLogistica ?? ""),
      fechaCierreEntrega: toDate(lg.fechaCierreEntrega),
    },
  });

  const onSubmit = async (data: LogForm) => {
    setSaving(true);
    try {
      await axios.put(`/api/proyectos/${proyecto._id}`, { datosFormulario: { logistica: data } });
      toast.success("Logística actualizada");
      qc.invalidateQueries({ queryKey: ["proyecto", String(proyecto._id)] });
      setOpen(false);
      onSaved?.();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const Sel = ({ name, label, opts }: { name: keyof LogForm; label: string; opts: string[] }) => (
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
        <SheetHeader className="mb-4"><SheetTitle>Editar Logística</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-10">

          <div className="grid grid-cols-2 gap-3">
            <Sel name="estadoEntrega" label="Estado de entrega" opts={["Pendiente", "Entregado", "Parcial", "Rechazado", "Reprogramado"]} />
            <div className="space-y-1"><Label>N° orden logística</Label><Input {...register("numeroOrdenLogistica")} /></div>
          </div>
          <div className="space-y-1"><Label>Cliente / Obra / Empresa</Label><Input {...register("clienteObraEmpresa")} /></div>
          <div className="space-y-1"><Label>Dirección entrega / obra</Label><Input {...register("direccionEntregaObra")} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Fecha programada</Label><Input type="date" {...register("fechaProgramadaEntrega")} /></div>
            <div className="space-y-1"><Label>Responsable logística</Label><Input {...register("responsableLogistica")} /></div>
          </div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transporte</p>

          <div className="grid grid-cols-2 gap-3">
            <Sel name="tipoEntrega" label="Tipo de entrega" opts={["Entrega a obra", "Retiro en fábrica", "Instalación directa"]} />
            <Sel name="medioTransporte" label="Medio de transporte" opts={["Camión propio", "Flete externo", "Vehículo utilitario"]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Sel name="estadoPedidoRecibidoTaller" label="Estado pedido de taller" opts={["Completo", "Parcial", "Con faltantes", "En revisión"]} />
            <Sel name="verificacionEmbalaje" label="Verificación embalaje" opts={["Correcto", "Incompleto", "Daños leves", "Daños graves"]} />
          </div>
          <div className="space-y-1"><Label>Cantidad de bultos</Label><Input type="number" {...register("cantidadBultos")} /></div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entrega</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Hora salida</Label><Input type="time" {...register("horaSalida")} /></div>
            <div className="space-y-1"><Label>Hora llegada</Label><Input type="time" {...register("horaLlegada")} /></div>
          </div>
          <div className="space-y-1"><Label>Responsable que recibe</Label><Input {...register("responsableQueRecibe")} /></div>
          <div className="space-y-1"><Label>Informe logística</Label><Textarea {...register("informeLogistica")} rows={3} /></div>
          <div className="space-y-1"><Label>Fecha cierre entrega</Label><Input type="date" {...register("fechaCierreEntrega")} /></div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
