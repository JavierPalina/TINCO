// ./src/components/proyectos/FormDeposito.tsx
"use client";

import { useState } from "react";
import axios from "axios";
import { useForm, Controller } from "react-hook-form";
import { IProyecto } from "@/models/Proyecto";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

type FormDepositoProps = {
  proyecto: IProyecto;
  onClose: () => void;
  onSaved: () => void;
};

export type DepositoFormValues = {
  numeroOrdenDeposito: string;
  fechaIngresoDeposito: string; // ISO (yyyy-mm-dd)
  responsableRecepcion: string;

  origenPedido: string;
  estadoProductoRecibido: string;

  cantidadUnidades: number | null;

  ubicacionSeleccion: string;
  ubicacionDetalle: string;

  verificacionEmbalaje: string;

  identificacion: string;

  materialAlmacenado: string;
  materialAlmacenadoOtro: string;

  controlMedidasOk: boolean;
  cantidadPiezasControladas: number | null;

  condicionVidrio: string;

  // URLs/paths
  fotosIngreso: string[];

  fechaSalidaEntrega: string; // ISO (yyyy-mm-dd) opcional ("" si no hay)
  estadoActualPedido: string;

  observacionesDeposito: string;
  usuarioEncargado: string;

  // flags para lógica de negocio
  crearTareaReposicion: boolean;
};

type ProyectoConDeposito = IProyecto & {
  deposito?: Partial<DepositoFormValues> | null;
};

export default function FormDeposito({
  proyecto,
  onClose,
  onSaved,
}: FormDepositoProps) {
  const depositoPrevio: Partial<DepositoFormValues> =
    (proyecto as ProyectoConDeposito).deposito || {};

  const todayISO = new Date().toISOString().slice(0, 10);

  const [ubicaciones, setUbicaciones] = useState<string[]>(
    [
      "Sector A – Perfiles / Estantería 1 – Nivel 1",
      "Sector B – Herrajes / Estantería 3 – Nivel 2",
      "Sector C – Vidrios / Estantería 2 – Nivel 3",
      "Sector D – Terminados / Estantería 1 – Nivel 4",
      depositoPrevio.ubicacionSeleccion || "",
    ].filter(Boolean),
  );

  const [nuevaUbicacion, setNuevaUbicacion] = useState("");
  const [nuevaVerificacionEmbalaje, setNuevaVerificacionEmbalaje] =
    useState("");

  const [verificacionesEmbalaje, setVerificacionesEmbalaje] = useState<
    string[]
  >(
    [
      "Correcto",
      "Incompleto",
      "Dañado",
      "Requiere refuerzo",
      "Mal rotulado",
      "Sucio o con polvo",
      "Reembalado",
      "Pendiente de revisión",
      "No corresponde al pedido",
      "Listo para entregar",
      depositoPrevio.verificacionEmbalaje || "",
    ].filter(Boolean),
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<DepositoFormValues>({
    defaultValues: {
      numeroOrdenDeposito:
        depositoPrevio.numeroOrdenDeposito ||
        `${proyecto.numeroOrden ?? ""}-DEP`,
      fechaIngresoDeposito: depositoPrevio.fechaIngresoDeposito || todayISO,
      responsableRecepcion: depositoPrevio.responsableRecepcion || "",

      origenPedido: depositoPrevio.origenPedido || "Taller",
      estadoProductoRecibido: depositoPrevio.estadoProductoRecibido || "Correcto",

      cantidadUnidades: depositoPrevio.cantidadUnidades ?? null,

      ubicacionSeleccion: depositoPrevio.ubicacionSeleccion || "",
      ubicacionDetalle: depositoPrevio.ubicacionDetalle || "",

      verificacionEmbalaje: depositoPrevio.verificacionEmbalaje || "Correcto",
      identificacion: depositoPrevio.identificacion || "",

      materialAlmacenado: depositoPrevio.materialAlmacenado || "Aluminio",
      materialAlmacenadoOtro: depositoPrevio.materialAlmacenadoOtro || "",

      controlMedidasOk: depositoPrevio.controlMedidasOk ?? false,
      cantidadPiezasControladas: depositoPrevio.cantidadPiezasControladas ?? null,

      condicionVidrio: depositoPrevio.condicionVidrio || "Sin daño",

      fotosIngreso: depositoPrevio.fotosIngreso || [],

      fechaSalidaEntrega: depositoPrevio.fechaSalidaEntrega || "",
      estadoActualPedido: depositoPrevio.estadoActualPedido || "En depósito",

      observacionesDeposito: depositoPrevio.observacionesDeposito || "",
      usuarioEncargado: depositoPrevio.usuarioEncargado || "",

      crearTareaReposicion: depositoPrevio.crearTareaReposicion ?? false,
    },
  });

  const estadoProductoRecibido = watch("estadoProductoRecibido");
  const condicionVidrio = watch("condicionVidrio");
  const materialAlmacenado = watch("materialAlmacenado");

  const hayFaltante =
    (estadoProductoRecibido || "").toLowerCase().includes("faltante") ||
    condicionVidrio === "Faltante";

  const onSubmit = async (values: DepositoFormValues) => {
    try {
      const payload: DepositoFormValues = {
        ...values,
        crearTareaReposicion: hayFaltante || values.crearTareaReposicion,
      };

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        etapaACompletar: "deposito",
        datosFormulario: payload,
      });

      toast.success("Formulario de Depósito guardado correctamente");
      onSaved();
      onClose();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(apiError?.error ?? error.message ?? "Error al guardar Depósito");
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar el formulario de Depósito",
      );
    }
  };

  const handleAgregarUbicacion = () => {
    const trimmed = nuevaUbicacion.trim();
    if (!trimmed) return;
    if (!ubicaciones.includes(trimmed)) {
      setUbicaciones((prev) => [...prev, trimmed]);
    }
    setNuevaUbicacion("");
  };

  const handleEliminarUbicacion = (item: string) => {
    setUbicaciones((prev) => prev.filter((u) => u !== item));
  };

  const handleAgregarVerificacionEmbalaje = () => {
    const trimmed = nuevaVerificacionEmbalaje.trim();
    if (!trimmed) return;
    if (!verificacionesEmbalaje.includes(trimmed)) {
      setVerificacionesEmbalaje((prev) => [...prev, trimmed]);
    }
    setNuevaVerificacionEmbalaje("");
  };

  const handleEliminarVerificacionEmbalaje = (item: string) => {
    setVerificacionesEmbalaje((prev) => prev.filter((u) => u !== item));
  };

  return (
    <div className="w-full max-w-3xl p-4 sm:p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          Formulario de Depósito – Orden {proyecto.numeroOrden}
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestión del ingreso, control y almacenamiento del pedido en depósito.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* N° de Orden / fechas / responsables */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="numeroOrdenDeposito">N° Orden de Depósito</Label>
            <Input id="numeroOrdenDeposito" {...register("numeroOrdenDeposito")} />
            <p className="text-[11px] text-muted-foreground">
              Se vincula con Taller y Logística.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="fechaIngresoDeposito">Fecha de ingreso al depósito</Label>
            <Input
              id="fechaIngresoDeposito"
              type="date"
              {...register("fechaIngresoDeposito")}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="responsableRecepcion">Responsable de recepción</Label>
            <Input
              id="responsableRecepcion"
              placeholder="Usuario encargado del depósito"
              {...register("responsableRecepcion")}
            />
          </div>
        </div>

        {/* Origen / estado / cantidad */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Origen del pedido</Label>
            <Controller
              name="origenPedido"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Taller">Taller</SelectItem>
                    <SelectItem value="Proveedor">Proveedor</SelectItem>
                    <SelectItem value="Devolución">Devolución</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label>Estado del producto recibido</Label>
            <Controller
              name="estadoProductoRecibido"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Correcto">Correcto</SelectItem>
                    <SelectItem value="Incompleto">Incompleto</SelectItem>
                    <SelectItem value="Dañado">Dañado</SelectItem>
                    <SelectItem value="Con faltantes">Con faltantes</SelectItem>
                    <SelectItem value="En revisión">En revisión</SelectItem>
                    <SelectItem value="En reparación">En reparación</SelectItem>
                    <SelectItem value="Pendiente de control">Pendiente de control</SelectItem>
                    <SelectItem value="Rechazado">Rechazado</SelectItem>
                    <SelectItem value="En cuarentena">
                      En cuarentena (espera de autorización)
                    </SelectItem>
                    <SelectItem value="Listo para entregar">Listo para entregar</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cantidadUnidades">Cantidad de unidades</Label>
            <Input
              id="cantidadUnidades"
              type="number"
              min={0}
              {...register("cantidadUnidades", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className="space-y-2 border rounded-md p-3">
          <Label>Ubicación en el depósito</Label>

          <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Selección rápida</Label>
              <Controller
                name="ubicacionSeleccion"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {ubicaciones.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Agregar nueva ubicación"
                  value={nuevaUbicacion}
                  onChange={(e) => setNuevaUbicacion(e.target.value)}
                  className="text-xs"
                />
                <Button type="button" size="icon" variant="outline" onClick={handleAgregarUbicacion}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {ubicaciones.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {ubicaciones.map((u) => (
                    <span
                      key={u}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]"
                    >
                      {u}
                      <button
                        type="button"
                        onClick={() => handleEliminarUbicacion(u)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Detalle / Código interno / Nota de ubicación
              </Label>
              <Textarea
                rows={3}
                placeholder='Ej: "Sector C – Vidrios / Estantería 2 – Nivel 3 – Código C07"'
                {...register("ubicacionDetalle")}
              />
              <p className="text-[11px] text-muted-foreground">
                Podés usar códigos internos (A01, B03, C07) o un código QR físico del depósito.
              </p>
            </div>
          </div>
        </div>

        {/* Verificación de embalaje */}
        <div className="space-y-2 border rounded-md p-3">
          <Label>Verificación de embalaje</Label>

          <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estado del embalaje</Label>
              <Controller
                name="verificacionEmbalaje"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {verificacionesEmbalaje.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <div className="mt-2 flex gap-2">
                <Input
                  placeholder="Agregar nuevo estado de embalaje"
                  value={nuevaVerificacionEmbalaje}
                  onChange={(e) => setNuevaVerificacionEmbalaje(e.target.value)}
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleAgregarVerificacionEmbalaje}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {verificacionesEmbalaje.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {verificacionesEmbalaje.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px]"
                    >
                      {v}
                      <button
                        type="button"
                        onClick={() => handleEliminarVerificacionEmbalaje(v)}
                        className="hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="identificacion" className="text-xs">
                Identificación (texto / etiqueta / QR)
              </Label>
              <Input
                id="identificacion"
                placeholder="Código interno, etiqueta física, etc."
                {...register("identificacion")}
              />
            </div>
          </div>
        </div>

        {/* Material / medidas / vidrio */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Material almacenado</Label>
            <Controller
              name="materialAlmacenado"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aluminio">Aluminio</SelectItem>
                    <SelectItem value="PVC">PVC</SelectItem>
                    <SelectItem value="Vidrio">Vidrio</SelectItem>
                    <SelectItem value="Herrajes">Herrajes</SelectItem>
                    <SelectItem value="Otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {materialAlmacenado === "Otros" && (
              <Input
                className="mt-1 text-xs"
                placeholder="Especificar material"
                {...register("materialAlmacenadoOtro")}
              />
            )}
          </div>

          <div className="space-y-1">
            <Label>Control de medidas y piezas</Label>
            <div className="flex items-center gap-2 mt-1">
              <Controller
                name="controlMedidasOk"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <span className="text-sm">Confirmar que coincide con la orden</span>
            </div>
            <Input
              className="mt-2"
              type="number"
              min={0}
              placeholder="Cantidad de piezas controladas"
              {...register("cantidadPiezasControladas", { valueAsNumber: true })}
            />
          </div>

          <div className="space-y-1">
            <Label>Condición del vidrio</Label>
            <Controller
              name="condicionVidrio"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar condición" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sin daño">Sin daño</SelectItem>
                    <SelectItem value="Rayado">Rayado</SelectItem>
                    <SelectItem value="Faltante">Faltante</SelectItem>
                    <SelectItem value="Reposición solicitada">
                      Reposición solicitada
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Fotos de ingreso */}
        <div className="space-y-1">
          <Label>Fotos de ingreso al depósito</Label>
          <p className="text-[11px] text-muted-foreground mb-1">
            Mínimo 2 fotos (bulto y etiqueta visible). Integrá acá tu componente de subida.
          </p>
          <Textarea
            rows={2}
            placeholder="Pegá URLs (una por línea)."
            {...register("fotosIngreso", {
              setValueAs: (val: string) =>
                typeof val === "string"
                  ? val
                      .split("\n")
                      .map((v) => v.trim())
                      .filter(Boolean)
                  : [],
            })}
          />
        </div>

        {/* Fecha salida / estado actual / usuario */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="fechaSalidaEntrega">Fecha de salida / entrega</Label>
            <Input id="fechaSalidaEntrega" type="date" {...register("fechaSalidaEntrega")} />
            <p className="text-[11px] text-muted-foreground">Para logística o retiro por cliente.</p>
          </div>

          <div className="space-y-1">
            <Label>Estado actual del pedido</Label>
            <Controller
              name="estadoActualPedido"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En depósito">En depósito</SelectItem>
                    <SelectItem value="Listo para entrega">Listo para entrega</SelectItem>
                    <SelectItem value="En revisión">En revisión</SelectItem>
                    <SelectItem value="Devolución">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              El backend puede usar este estado para notificar a Logística o Taller/Verificación.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="usuarioEncargado">Usuario encargado</Label>
            <Input
              id="usuarioEncargado"
              placeholder="Usuario responsable del caso"
              {...register("usuarioEncargado")}
            />
          </div>
        </div>

        {/* Observaciones / flags */}
        <div className="space-y-2">
          <Label htmlFor="observacionesDeposito">Observaciones o Informe de Depósito</Label>
          <Textarea id="observacionesDeposito" rows={3} {...register("observacionesDeposito")} />

          <div className="mt-3 flex items-center gap-2">
            <Controller
              name="crearTareaReposicion"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value || hayFaltante}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <span className="text-sm">
              Marcar para generar tarea de <strong>Pedidos de reposición</strong>.
            </span>
          </div>

          {hayFaltante && (
            <p className="text-[11px] text-amber-600 mt-1">
              Detectado estado con faltantes/vidrio faltante: se sugerirá crear tarea de reposición.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              "Guardar depósito"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
