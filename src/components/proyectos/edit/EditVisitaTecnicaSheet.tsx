"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Loader2, Plus, Trash2 } from "lucide-react";

import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ProyectoDTO } from "@/types/proyecto";

type VisitaForm = {
  tipoVisita: string;
  fechaVisita: string;
  horaVisita: string;
  direccion: string;
  entrecalles: string;
  otraInfoDireccion: string;
  estadoObra: string;
  condicionVanos: string[];
  tipoAberturaMedida: string;
  materialSolicitado: string;
  color: string;
  vidriosConfirmados: string;
  recomendacionTecnica: string;
  estadoTareaVisita: string;
  observacionesTecnicas: string;
  medidasTomadas: { alto: string; ancho: string }[];
};

const CONDICION_OPTIONS = [
  "Nivelado", "Desnivelado", "Con revoque", "Sin revoque", "Con marco existente",
];

function toDateInput(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function EditVisitaTecnicaSheet({ proyecto, onSaved }: { proyecto: ProyectoDTO; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const vt = (proyecto.visitaTecnica ?? {}) as Record<string, unknown>;

  const { register, handleSubmit, control, watch, setValue, reset } = useForm<VisitaForm>({
    defaultValues: {
      tipoVisita: String(vt.tipoVisita ?? ""),
      fechaVisita: toDateInput(vt.fechaVisita),
      horaVisita: String(vt.horaVisita ?? ""),
      direccion: String(vt.direccion ?? ""),
      entrecalles: String(vt.entrecalles ?? ""),
      otraInfoDireccion: String(vt.otraInfoDireccion ?? ""),
      estadoObra: String(vt.estadoObra ?? ""),
      condicionVanos: Array.isArray(vt.condicionVanos) ? vt.condicionVanos as string[] : [],
      tipoAberturaMedida: String(vt.tipoAberturaMedida ?? ""),
      materialSolicitado: String(vt.materialSolicitado ?? ""),
      color: String(vt.color ?? ""),
      vidriosConfirmados: String(vt.vidriosConfirmados ?? ""),
      recomendacionTecnica: String(vt.recomendacionTecnica ?? ""),
      estadoTareaVisita: String(vt.estadoTareaVisita ?? ""),
      observacionesTecnicas: String(vt.observacionesTecnicas ?? ""),
      medidasTomadas: Array.isArray(vt.medidasTomadas)
        ? (vt.medidasTomadas as { alto?: unknown; ancho?: unknown }[]).map((m) => ({
            alto: String(m.alto ?? ""),
            ancho: String(m.ancho ?? ""),
          }))
        : [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "medidasTomadas" });
  const condicionVanos = watch("condicionVanos");

  const toggleCondicion = (val: string) => {
    const current = condicionVanos ?? [];
    setValue(
      "condicionVanos",
      current.includes(val) ? current.filter((v) => v !== val) : [...current, val],
    );
  };

  const onSubmit = async (data: VisitaForm) => {
    setSaving(true);
    try {
      await axios.put(`/api/proyectos/${proyecto._id}`, {
        datosFormulario: { visitaTecnica: data },
      });
      toast.success("Visita técnica actualizada");
      qc.invalidateQueries({ queryKey: ["proyecto", String(proyecto._id)] });
      setOpen(false);
      onSaved?.();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) reset(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pencil className="h-3.5 w-3.5" /> Editar
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Editar Visita Técnica</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-10">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo de visita</Label>
              <Input {...register("tipoVisita")} placeholder="Ej: Primera visita" />
            </div>
            <div className="space-y-1">
              <Label>Estado tarea</Label>
              <Controller control={control} name="estadoTareaVisita" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
                  <SelectContent>
                    {["Aprobado", "Pendiente", "Rechazado"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Fecha visita</Label>
              <Input type="date" {...register("fechaVisita")} />
            </div>
            <div className="space-y-1">
              <Label>Hora</Label>
              <Input type="time" {...register("horaVisita")} />
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label>Dirección</Label>
            <Input {...register("direccion")} placeholder="Dirección de la obra" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Entrecalles</Label>
              <Input {...register("entrecalles")} />
            </div>
            <div className="space-y-1">
              <Label>Otra info</Label>
              <Input {...register("otraInfoDireccion")} />
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label>Estado obra</Label>
            <Input {...register("estadoObra")} placeholder="Ej: En construcción" />
          </div>

          <div className="space-y-2">
            <Label>Condición de vanos</Label>
            <div className="flex flex-wrap gap-3">
              {CONDICION_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox
                    checked={condicionVanos?.includes(opt)}
                    onCheckedChange={() => toggleCondicion(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo abertura</Label>
              <Input {...register("tipoAberturaMedida")} placeholder="Ventana, Puerta..." />
            </div>
            <div className="space-y-1">
              <Label>Material solicitado</Label>
              <Input {...register("materialSolicitado")} />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input {...register("color")} />
            </div>
            <div className="space-y-1">
              <Label>Vidrios</Label>
              <Input {...register("vidriosConfirmados")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Recomendación técnica</Label>
            <Controller control={control} name="recomendacionTecnica" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {["Aprobado", "Revisión", "Requiere ajuste", "Postergar instalación"].map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          <div className="space-y-1">
            <Label>Observaciones técnicas</Label>
            <Textarea {...register("observacionesTecnicas")} rows={3} />
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Medidas tomadas</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ alto: "", ancho: "" })}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
              </Button>
            </div>
            {fields.map((f, i) => (
              <div key={f.id} className="flex gap-2 items-center">
                <Input {...register(`medidasTomadas.${i}.alto`)} placeholder="Alto (cm)" className="flex-1" />
                <Input {...register(`medidasTomadas.${i}.ancho`)} placeholder="Ancho (cm)" className="flex-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
