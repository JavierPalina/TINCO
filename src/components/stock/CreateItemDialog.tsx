"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, Info } from "lucide-react";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type ItemForm = {
  sku: string;
  name: string;
  type: "SERVICE" | "COMPONENT" | "FINISHED";
  uom: "UN" | "M" | "M2" | "KG";
  category: string;
};

// El modelo usa SERVICE para materia prima / insumos (aluminio, vidrio, selladores, etc.)
const TYPE_INFO: Record<"SERVICE" | "COMPONENT" | "FINISHED", { label: string; desc: string }> = {
  SERVICE: {
    label: "Materia prima / Insumo",
    desc: "Ej: perfil de aluminio en metros, vidrio crudo, chapa, sellador, silicona, goma de estanqueidad.",
  },
  COMPONENT: {
    label: "Componente",
    desc: "Ej: herraje de cerradura, bisagra, tornillo, junta EPDM, travesaño cortado, ruedita.",
  },
  FINISHED: {
    label: "Producto terminado",
    desc: "Ej: ventana corrediza 150×100 armada, puerta batiente con marco, celosía enrejada lista para instalar.",
  },
};

const UOM_INFO = {
  UN: "Unidad — para herrajes, vidrios, piezas individuales",
  M: "Metro lineal — para perfiles de aluminio o PVC",
  M2: "Metro cuadrado — para chapas, vidrios por superficie",
  KG: "Kilogramo — para masilla, sellador, polvo de aluminio",
};

const PRESET_CATEGORIES = [
  "Perfiles aluminio",
  "Perfiles PVC",
  "Vidrios",
  "Herrajes",
  "Selladores y juntas",
  "Tornillería",
  "Chapas y planchuelas",
  "Accesorios de instalación",
  "Productos terminados",
  "Otros",
];

export function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { register, handleSubmit, control, watch, reset, setValue } = useForm<ItemForm>({
    defaultValues: { type: "SERVICE", uom: "UN", category: "" },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: ItemForm) => {
    setSaving(true);
    try {
      await axios.post("/api/items", data);
      toast.success("Ítem creado correctamente");
      qc.invalidateQueries({ queryKey: ["itemsList"] });
      setOpen(false);
      reset();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.error ?? "Error al crear el ítem");
      } else {
        toast.error("Error al crear el ítem");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />Nuevo ítem</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar ítem al catálogo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">

          {/* Type selector with inline explanation */}
          <div className="space-y-2">
            <Label>Tipo de ítem <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-3 gap-2">
              {(["SERVICE", "COMPONENT", "FINISHED"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t)}
                  className={`rounded-lg border p-2.5 text-left transition-colors ${
                    selectedType === t
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="text-xs font-semibold">{TYPE_INFO[t].label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t}</div>
                </button>
              ))}
            </div>
            {selectedType && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md p-2">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{TYPE_INFO[selectedType].desc}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>SKU <span className="text-destructive">*</span></Label>
              <Input
                {...register("sku", { required: true })}
                placeholder="Ej: PERF-A30-6M"
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Código único. Sin espacios.</p>
            </div>
            <div className="space-y-1">
              <Label>Unidad de medida <span className="text-destructive">*</span></Label>
              <Controller control={control} name="uom" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["UN", "M", "M2", "KG"] as const).map((u) => (
                      <SelectItem key={u} value={u}>
                        <div>
                          <span className="font-medium">{u}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {u === "UN" ? "Unidad" : u === "M" ? "Metro" : u === "M2" ? "Metro²" : "Kilogramo"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              <p className="text-[10px] text-muted-foreground">{UOM_INFO[watch("uom")]}</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Descripción / Nombre <span className="text-destructive">*</span></Label>
            <Input
              {...register("name", { required: true })}
              placeholder="Ej: Perfil guía inferior A30 Aluar 6m"
            />
          </div>

          <div className="space-y-1">
            <Label>Categoría <span className="text-destructive">*</span></Label>
            <Controller control={control} name="category" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría..." /></SelectTrigger>
                <SelectContent>
                  {PRESET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
            <Input
              className="mt-1 text-sm"
              placeholder="O escribí una categoría personalizada"
              onChange={(e) => setValue("category", e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear ítem
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
