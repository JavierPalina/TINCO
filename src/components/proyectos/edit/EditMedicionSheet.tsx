"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Loader2, Plus, Trash2 } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ProyectoDTO } from "@/types/proyecto";

type MedicionForm = {
  estado: string;
  fechaMedicion: string;
  numeroOrdenMedicion: string;
  clienteObraEmpresa: string;
  direccionObra: string;
  tipoAberturaMedida: string;
  cantidadAberturasMedidas: string;
  condicionVanos: string[];
  estadoObraMedicion: string;
  tipoPerfilPrevisto: string;
  color: string;
  tipoVidrioSolicitado: string;
  toleranciasRecomendadas: string;
  observacionesMedicion: string;
  estadoFinalMedicion: string;
  enviarAVerificacion: string;
  medidasTomadas: { alto: string; ancho: string }[];
};

const CONDICION_OPTIONS = ["Nivelado", "Desnivelado", "Con revoque", "Sin revoque", "Con marco existente"];
const PERFILES = ["A30 New (Aluar)", "A45 (Aluar)", "A62 (Aluar)", "Módena (Tecnoperfiles)", "Presto (Tecnoperfiles)", "Rehau 70mm", "Deceuninck 70mm", "Alcemar 70mm", "PVC estándar", "Otro"];

function toDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function EditMedicionSheet({ proyecto, onSaved }: { proyecto: ProyectoDTO; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const md = (proyecto.medicion ?? {}) as Record<string, unknown>;

  const { register, handleSubmit, control, watch, setValue, reset } = useForm<MedicionForm>({
    defaultValues: {
      estado: String(md.estado ?? ""),
      fechaMedicion: toDate(md.fechaMedicion),
      numeroOrdenMedicion: String(md.numeroOrdenMedicion ?? ""),
      clienteObraEmpresa: String(md.clienteObraEmpresa ?? ""),
      direccionObra: String(md.direccionObra ?? ""),
      tipoAberturaMedida: String(md.tipoAberturaMedida ?? ""),
      cantidadAberturasMedidas: String(md.cantidadAberturasMedidas ?? ""),
      condicionVanos: Array.isArray(md.condicionVanos) ? md.condicionVanos as string[] : [],
      estadoObraMedicion: String(md.estadoObraMedicion ?? ""),
      tipoPerfilPrevisto: String(md.tipoPerfilPrevisto ?? ""),
      color: String(md.color ?? ""),
      tipoVidrioSolicitado: String(md.tipoVidrioSolicitado ?? ""),
      toleranciasRecomendadas: String(md.toleranciasRecomendadas ?? ""),
      observacionesMedicion: String(md.observacionesMedicion ?? ""),
      estadoFinalMedicion: String(md.estadoFinalMedicion ?? ""),
      enviarAVerificacion: String(md.enviarAVerificacion ?? ""),
      medidasTomadas: Array.isArray(md.medidasTomadas)
        ? (md.medidasTomadas as { alto?: unknown; ancho?: unknown }[]).map((m) => ({
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
    setValue("condicionVanos", current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
  };

  const onSubmit = async (data: MedicionForm) => {
    setSaving(true);
    try {
      await axios.put(`/api/proyectos/${proyecto._id}`, { datosFormulario: { medicion: data } });
      toast.success("Medición actualizada");
      qc.invalidateQueries({ queryKey: ["proyecto", String(proyecto._id)] });
      setOpen(false);
      onSaved?.();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (v) reset(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Pencil className="h-3.5 w-3.5" />Editar</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4"><SheetTitle>Editar Medición</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-10">

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Estado</Label>
              <Controller control={control} name="estado" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
                  <SelectContent>
                    {["Pendiente", "Completado", "Parcial", "Requiere nueva visita"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>N° orden medición</Label>
              <Input {...register("numeroOrdenMedicion")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Fecha medición</Label>
              <Input type="date" {...register("fechaMedicion")} />
            </div>
            <div className="space-y-1">
              <Label>Cantidad aberturas</Label>
              <Input type="number" {...register("cantidadAberturasMedidas")} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Dirección de obra</Label>
            <Input {...register("direccionObra")} />
          </div>
          <div className="space-y-1">
            <Label>Cliente / Obra / Empresa</Label>
            <Input {...register("clienteObraEmpresa")} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo de abertura</Label>
              <Controller control={control} name="tipoAberturaMedida" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Tipo..." /></SelectTrigger>
                  <SelectContent>
                    {["Ventana", "Puerta", "Corrediza", "Paño fijo", "Batiente"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>Estado de la obra</Label>
              <Controller control={control} name="estadoObraMedicion" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
                  <SelectContent>
                    {["En construcción", "Terminada", "Refacción"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Condición de vanos</Label>
            <div className="flex flex-wrap gap-3">
              {CONDICION_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <Checkbox checked={condicionVanos?.includes(opt)} onCheckedChange={() => toggleCondicion(opt)} />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Medidas tomadas</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ alto: "", ancho: "" })}>
                <Plus className="h-3.5 w-3.5 mr-1" />Agregar
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

          <div className="space-y-1">
            <Label>Tolerancias recomendadas</Label>
            <Textarea {...register("toleranciasRecomendadas")} rows={2} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Tipo de perfil previsto</Label>
              <Controller control={control} name="tipoPerfilPrevisto" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Perfil..." /></SelectTrigger>
                  <SelectContent>{PERFILES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <Input {...register("color")} />
            </div>
            <div className="space-y-1">
              <Label>Tipo de vidrio</Label>
              <Controller control={control} name="tipoVidrioSolicitado" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Vidrio..." /></SelectTrigger>
                  <SelectContent>
                    {["Simple", "DVH", "Laminado", "Esmerilado", "Reflectivo"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Observaciones</Label>
            <Textarea {...register("observacionesMedicion")} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Estado final medición</Label>
              <Controller control={control} name="estadoFinalMedicion" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Estado..." /></SelectTrigger>
                  <SelectContent>
                    {["Completada", "Parcial", "Requiere nueva visita"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1">
              <Label>Enviar a verificación</Label>
              <Controller control={control} name="enviarAVerificacion" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
                  <SelectContent>
                    {["Sí", "No", "En revisión"].map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
