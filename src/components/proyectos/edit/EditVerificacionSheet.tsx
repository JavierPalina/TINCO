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

type VerifForm = {
  estado: string;
  clienteObraEmpresa: string;
  direccionObra: string;
  fechaRevisionPlano: string;
  fechaVerificacionCompleta: string;
  medidasVerificadas: string;
  medidasVerificadasObservaciones: string;
  fuenteMedidas: string;
  planosRevisados: string;
  materialesDisponiblesEstado: string;
  materialesFaltantesDetalle: string;
  materialesProveedorPendiente: string;
  listaMaterialesRevisada: string;
  accesoriosCompletosEstado: string;
  accesoriosFaltantesDetalle: string;
  vidriosDisponiblesEstado: string;
  tipoMaterial: string;
  tipoPerfilVerificado: string;
  proveedorPerfil: string;
  estadoPerfiles: string;
  compatibilidadHerrajes: string;
  medidasVidriosConfirmadas: string;
  color: string;
  estadoColor: string;
  estadoGeneralVerificacion: string;
  aprobadoParaProduccion: string;
  observacionesVerificacion: string;
};

function toDate(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function S({ name, label, options, control }: { name: keyof VerifForm; label: string; options: string[]; control: ReturnType<typeof useForm<VerifForm>>["control"] }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Controller control={control} name={name} render={({ field }) => (
        <Select value={field.value} onValueChange={field.onChange}>
          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>{options.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
        </Select>
      )} />
    </div>
  );
}

export function EditVerificacionSheet({ proyecto, onSaved }: { proyecto: ProyectoDTO; onSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const v = (proyecto.verificacion ?? {}) as Record<string, unknown>;

  const { register, handleSubmit, control, reset } = useForm<VerifForm>({
    defaultValues: {
      estado: String(v.estado ?? ""),
      clienteObraEmpresa: String(v.clienteObraEmpresa ?? ""),
      direccionObra: String(v.direccionObra ?? ""),
      fechaRevisionPlano: toDate(v.fechaRevisionPlano),
      fechaVerificacionCompleta: toDate(v.fechaVerificacionCompleta),
      medidasVerificadas: String(v.medidasVerificadas ?? ""),
      medidasVerificadasObservaciones: String(v.medidasVerificadasObservaciones ?? ""),
      fuenteMedidas: String(v.fuenteMedidas ?? ""),
      planosRevisados: String(v.planosRevisados ?? ""),
      materialesDisponiblesEstado: String(v.materialesDisponiblesEstado ?? ""),
      materialesFaltantesDetalle: String(v.materialesFaltantesDetalle ?? ""),
      materialesProveedorPendiente: String(v.materialesProveedorPendiente ?? ""),
      listaMaterialesRevisada: String(v.listaMaterialesRevisada ?? ""),
      accesoriosCompletosEstado: String(v.accesoriosCompletosEstado ?? ""),
      accesoriosFaltantesDetalle: String(v.accesoriosFaltantesDetalle ?? ""),
      vidriosDisponiblesEstado: String(v.vidriosDisponiblesEstado ?? ""),
      tipoMaterial: String(v.tipoMaterial ?? ""),
      tipoPerfilVerificado: String(v.tipoPerfilVerificado ?? ""),
      proveedorPerfil: String(v.proveedorPerfil ?? ""),
      estadoPerfiles: String(v.estadoPerfiles ?? ""),
      compatibilidadHerrajes: String(v.compatibilidadHerrajes ?? ""),
      medidasVidriosConfirmadas: String(v.medidasVidriosConfirmadas ?? ""),
      color: String(v.color ?? ""),
      estadoColor: String(v.estadoColor ?? ""),
      estadoGeneralVerificacion: String(v.estadoGeneralVerificacion ?? ""),
      aprobadoParaProduccion: String(v.aprobadoParaProduccion ?? ""),
      observacionesVerificacion: String(v.observacionesVerificacion ?? ""),
    },
  });

  const onSubmit = async (data: VerifForm) => {
    setSaving(true);
    try {
      await axios.put(`/api/proyectos/${proyecto._id}`, { datosFormulario: { verificacion: data } });
      toast.success("Verificación actualizada");
      qc.invalidateQueries({ queryKey: ["proyecto", String(proyecto._id)] });
      setOpen(false);
      onSaved?.();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={(v2) => { setOpen(v2); if (v2) reset(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2"><Pencil className="h-3.5 w-3.5" />Editar</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4"><SheetTitle>Editar Verificación</SheetTitle></SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-10">

          <S name="estado" label="Estado" options={["Pendiente", "Completado", "Parcial", "Requiere nueva visita"]} control={control} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Fecha revisión plano</Label><Input type="date" {...register("fechaRevisionPlano")} /></div>
            <div className="space-y-1"><Label>Fecha verificación completa</Label><Input type="date" {...register("fechaVerificacionCompleta")} /></div>
          </div>
          <div className="space-y-1"><Label>Cliente / Obra / Empresa</Label><Input {...register("clienteObraEmpresa")} /></div>
          <div className="space-y-1"><Label>Dirección de obra</Label><Input {...register("direccionObra")} /></div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Medidas</p>
          <S name="medidasVerificadas" label="Medidas verificadas" options={["Sí", "No", "Observaciones"]} control={control} />
          <div className="space-y-1"><Label>Observaciones medidas</Label><Input {...register("medidasVerificadasObservaciones")} /></div>
          <div className="space-y-1"><Label>Fuente de medidas</Label><Input {...register("fuenteMedidas")} /></div>
          <div className="space-y-1"><Label>Planos revisados</Label><Input {...register("planosRevisados")} /></div>

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Materiales</p>
          <S name="materialesDisponiblesEstado" label="Estado materiales" options={["Sí", "No", "Faltan materiales", "Pendiente de ingreso", "En revisión"]} control={control} />
          <div className="space-y-1"><Label>Materiales faltantes</Label><Input {...register("materialesFaltantesDetalle")} /></div>
          <div className="space-y-1"><Label>Proveedor pendiente</Label><Input {...register("materialesProveedorPendiente")} /></div>
          <S name="listaMaterialesRevisada" label="Lista materiales revisada" options={["Sí", "Pendiente", "No"]} control={control} />

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Accesorios y vidrios</p>
          <S name="accesoriosCompletosEstado" label="Accesorios completos" options={["Sí", "No", "Faltan accesorios", "Pendiente de recepción", "En revisión"]} control={control} />
          <div className="space-y-1"><Label>Accesorios faltantes</Label><Input {...register("accesoriosFaltantesDetalle")} /></div>
          <S name="vidriosDisponiblesEstado" label="Vidrios disponibles" options={["Sí", "Pendiente", "No"]} control={control} />
          <S name="medidasVidriosConfirmadas" label="Medidas vidrios confirmadas" options={["Sí", "Pendiente", "No"]} control={control} />

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Perfiles</p>
          <S name="tipoMaterial" label="Tipo material" options={["Aluminio", "PVC", "Mixto", "Otro"]} control={control} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Tipo perfil verificado</Label><Input {...register("tipoPerfilVerificado")} /></div>
            <div className="space-y-1"><Label>Proveedor perfil</Label><Input {...register("proveedorPerfil")} /></div>
          </div>
          <S name="estadoPerfiles" label="Estado perfiles" options={["Buen estado", "Golpeado", "Rayado", "Sucio", "Deformado", "Cortado incorrecto", "Faltante", "En revisión", "En reparación", "Rechazado"]} control={control} />
          <S name="compatibilidadHerrajes" label="Compatibilidad herrajes" options={["Sí", "No", "Revisión"]} control={control} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Color</Label><Input {...register("color")} /></div>
          </div>
          <S name="estadoColor" label="Estado color" options={["Sí", "No", "En revisión", "Pendiente de recepción"]} control={control} />

          <Separator />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cierre</p>
          <S name="estadoGeneralVerificacion" label="Estado general verificación" options={["Aprobado", "Con observaciones", "Rechazado"]} control={control} />
          <S name="aprobadoParaProduccion" label="Aprobado para producción" options={["Sí", "No"]} control={control} />
          <div className="space-y-1"><Label>Observaciones</Label><Textarea {...register("observacionesVerificacion")} rows={3} /></div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
