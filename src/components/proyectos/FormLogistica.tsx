// ./src/components/proyectos/FormLogistica.tsx
"use client";

import { useMemo } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { IProyecto } from "@/models/Proyecto";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
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

const TIPO_ENTREGA_OPTS = [
  "Entrega a obra",
  "Retiro en fábrica",
  "Instalación directa",
] as const;

const MEDIO_TRANSPORTE_OPTS = [
  "Camión propio",
  "Flete externo",
  "Vehículo utilitario",
] as const;

const ESTADO_PEDIDO_TALLER_OPTS = [
  "Completo",
  "Parcial",
  "Con faltantes",
  "En revisión",
] as const;

const VERIFICACION_EMBALAJE_OPTS = [
  "Correcto",
  "Incompleto",
  "Daños leves",
  "Daños graves",
] as const;

const ESTADO_ENTREGA_OPTS = [
  "Entregado",
  "Parcial",
  "Rechazado",
  "Reprogramado",
] as const;

const NOTIFICAR_A_OPTS = [
  { value: "Administración", label: "Administración" },
  { value: "Facturación", label: "Facturación" },
  { value: "Vendedores", label: "Vendedores" },
  { value: "Postventa", label: "Postventa" },
] as const;

// ✅ Ojo: no usamos transform/coerce acá para evitar el “Control<...>” mismatch.
// Convertimos “cantidadBultos” manualmente en el onChange del input (a number|undefined).
const LogisticaSchema = z.object({
  numeroOrdenLogistica: z.string().optional(),

  clienteObraEmpresa: z
    .string()
    .min(1, { message: "Cliente / Obra / Empresa es obligatorio" }),

  direccionEntregaObra: z
    .string()
    .min(1, { message: "La dirección de entrega es obligatoria" }),

  fechaProgramadaEntrega: z
    .string()
    .min(1, { message: "La fecha programada es obligatoria" }),

  responsableLogistica: z
    .string()
    .min(1, { message: "Responsable de logística es obligatorio" }),

  tipoEntrega: z.enum(TIPO_ENTREGA_OPTS, {
    message: "Tipo de entrega obligatorio",
  }),

  medioTransporte: z.enum(MEDIO_TRANSPORTE_OPTS, {
    message: "Medio de transporte obligatorio",
  }),

  estadoPedidoRecibidoTaller: z.enum(ESTADO_PEDIDO_TALLER_OPTS, {
    message: "Estado del pedido recibido es obligatorio",
  }),

  verificacionEmbalaje: z.enum(VERIFICACION_EMBALAJE_OPTS, {
    message: "Verificación de embalaje obligatoria",
  }),

  cantidadBultos: z
  .number({ message: "Cantidad de bultos inválida" })
  .min(0, { message: "Cantidad de bultos inválida" })
  .optional(),

  horaSalida: z.string().optional(),
  horaLlegada: z.string().optional(),
  responsableQueRecibe: z.string().optional(),

  // Textarea donde pegás una URL por línea (solo UI; lo convertimos a array en submit)
  evidenciasRaw: z.string().optional(),

  informeLogistica: z.string().optional(),

  estadoEntrega: z.enum(ESTADO_ENTREGA_OPTS, {
    message: "Estado de la entrega obligatorio",
  }),

  firmaCliente: z.string().optional(),
  firmaChofer: z.string().optional(),

  // datetime-local (string). Si querés ISO estricto, convertimos al guardar.
  fechaCierreEntrega: z.string().optional(),

  notificarA: z.array(z.string()).optional(),
});

export type LogisticaFormValues = z.infer<typeof LogisticaSchema>;

// ✅ Tipos locales (para NO usar any)
type ClienteLite = { nombreCompleto?: string } | string | null | undefined;
type VisitaTecnicaLite = { direccion?: string | null } | null | undefined;

type TipoEntrega = (typeof TIPO_ENTREGA_OPTS)[number];
type MedioTransporte = (typeof MEDIO_TRANSPORTE_OPTS)[number];
type EstadoPedidoTaller = (typeof ESTADO_PEDIDO_TALLER_OPTS)[number];
type VerificacionEmbalaje = (typeof VERIFICACION_EMBALAJE_OPTS)[number];
type EstadoEntrega = (typeof ESTADO_ENTREGA_OPTS)[number];

type LogisticaDataLite = Partial<{
  numeroOrdenLogistica: string;
  clienteObraEmpresa: string;
  direccionEntregaObra: string;
  fechaProgramadaEntrega: string;
  responsableLogistica: string;

  tipoEntrega: TipoEntrega;
  medioTransporte: MedioTransporte;
  estadoPedidoRecibidoTaller: EstadoPedidoTaller;
  verificacionEmbalaje: VerificacionEmbalaje;

  cantidadBultos: number;

  horaSalida: string;
  horaLlegada: string;
  responsableQueRecibe: string;

  evidenciasEntrega: string[];

  informeLogistica: string;

  estadoEntrega: EstadoEntrega;

  firmaCliente: string;
  firmaChofer: string;

  fechaCierreEntrega: string;

  notificarA: string[];
}>;

type ProyectoConLogistica = IProyecto & {
  logistica?: LogisticaDataLite | null;
  cliente?: ClienteLite;
  visitaTecnica?: VisitaTecnicaLite;
};

function getClienteNombre(cliente: ClienteLite): string {
  if (!cliente) return "";
  if (typeof cliente === "string") return "";
  return cliente.nombreCompleto ?? "";
}

function getVisitaDireccion(visita: VisitaTecnicaLite): string {
  if (!visita) return "";
  return visita.direccion ?? "";
}

function safeToDateTimeLocal(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // si ya viene “YYYY-MM-DDTHH:mm”
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function toISOIfPossible(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value; // deja el string tal cual si no parsea
  return d.toISOString();
}

interface FormLogisticaProps {
  proyecto: IProyecto;
  onClose?: () => void;
  onSaved?: () => void;
}

export default function FormLogistica({
  proyecto,
  onClose,
  onSaved,
}: FormLogisticaProps) {
  const p = proyecto as ProyectoConLogistica;
  const logisticaData: LogisticaDataLite = p.logistica ?? {};

  const defaultEvidenciasRaw = useMemo(() => {
    const arr = logisticaData.evidenciasEntrega ?? [];
    return arr.join("\n");
  }, [logisticaData.evidenciasEntrega]);

  const form = useForm<LogisticaFormValues>({
    resolver: zodResolver(LogisticaSchema),
    defaultValues: {
      numeroOrdenLogistica:
        logisticaData.numeroOrdenLogistica || `${proyecto.numeroOrden ?? ""}-LOG`,
      clienteObraEmpresa:
        logisticaData.clienteObraEmpresa || getClienteNombre(p.cliente),
      direccionEntregaObra:
        logisticaData.direccionEntregaObra || getVisitaDireccion(p.visitaTecnica),
      fechaProgramadaEntrega: logisticaData.fechaProgramadaEntrega || "",
      responsableLogistica: logisticaData.responsableLogistica || "",

      tipoEntrega: logisticaData.tipoEntrega,
      medioTransporte: logisticaData.medioTransporte,
      estadoPedidoRecibidoTaller: logisticaData.estadoPedidoRecibidoTaller,
      verificacionEmbalaje: logisticaData.verificacionEmbalaje,

      cantidadBultos:
        typeof logisticaData.cantidadBultos === "number"
          ? logisticaData.cantidadBultos
          : undefined,

      horaSalida: logisticaData.horaSalida || "",
      horaLlegada: logisticaData.horaLlegada || "",
      responsableQueRecibe: logisticaData.responsableQueRecibe || "",

      evidenciasRaw: defaultEvidenciasRaw,

      informeLogistica: logisticaData.informeLogistica || "",

      estadoEntrega: logisticaData.estadoEntrega,

      firmaCliente: logisticaData.firmaCliente || "",
      firmaChofer: logisticaData.firmaChofer || "",

      fechaCierreEntrega: safeToDateTimeLocal(logisticaData.fechaCierreEntrega),

      notificarA: logisticaData.notificarA || [],
    },
  });

  const selectedNotificarA = form.watch("notificarA") || [];

  const onSubmit = async (values: LogisticaFormValues) => {
    try {
      const evidenciasEntrega =
        values.evidenciasRaw
          ?.split("\n")
          .map((s) => s.trim())
          .filter(Boolean) || [];

      const fechaProgramadaEntregaISO = toISOIfPossible(values.fechaProgramadaEntrega);

      const fechaCierreEntregaISO =
        values.estadoEntrega === "Entregado" && !values.fechaCierreEntrega
          ? new Date().toISOString()
          : toISOIfPossible(values.fechaCierreEntrega);

      // ✅ No mandamos evidenciasRaw al backend (solo UI)
      const { evidenciasRaw, ...rest } = values;

      const payload = {
        ...rest,
        fechaProgramadaEntrega: fechaProgramadaEntregaISO ?? values.fechaProgramadaEntrega,
        fechaCierreEntrega: fechaCierreEntregaISO ?? values.fechaCierreEntrega,
        evidenciasEntrega,
      };

      await axios.put(`/api/proyectos/${proyecto._id}`, {
        etapaACompletar: "logistica",
        datosFormulario: payload,
      });

      toast.success("Información de logística guardada correctamente.");
      onSaved?.();
      onClose?.();
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data as { error?: string } | undefined;
        toast.error(apiError?.error ?? error.message ?? "Error al guardar logística");
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar la información de logística",
      );
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        {/* Bloque principal */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="numeroOrdenLogistica"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° de Orden de logística</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 1234-LOG" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="clienteObraEmpresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente / Obra / Empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del cliente, obra o empresa" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="direccionEntregaObra"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Dirección de entrega / obra</FormLabel>
                <FormControl>
                  <Input placeholder="Dirección completa de la entrega / obra" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaProgramadaEntrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha programada de entrega</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsableLogistica"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable de logística / chofer</FormLabel>
                <FormControl>
                  <Input placeholder="Seleccioná o escribí el responsable" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tipo de entrega / transporte / estados */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="tipoEntrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de entrega</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_ENTREGA_OPTS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="medioTransporte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medio de transporte</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIO_TRANSPORTE_OPTS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estadoPedidoRecibidoTaller"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado del pedido recibido del taller</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADO_PEDIDO_TALLER_OPTS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Embalaje, bultos, horarios */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="verificacionEmbalaje"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verificación de embalaje</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICACION_EMBALAJE_OPTS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cantidadBultos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad de bultos / aberturas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Total cargado en el camión"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v === "" ? undefined : Number(v));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2 md:col-span-1">
            <FormField
              control={form.control}
              name="horaSalida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de salida (taller / depósito)</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="horaLlegada"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de llegada (obra / cliente / empresa)</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Recepción en obra y evidencias */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="responsableQueRecibe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable que recibe en obra / cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre de quien recibe la abertura" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="evidenciasRaw"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evidencia de entrega / instalación</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Pegá URLs (una por línea). Mínimo sugerido: 3 (carga, transporte, entrega)."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Informe */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="informeLogistica"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Informe de logística</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Incidencias, demoras, desvíos, observaciones de la ruta, etc."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estado, firmas */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="estadoEntrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de la entrega</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADO_ENTREGA_OPTS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Si está en <strong>Entregado</strong>, se completa automáticamente la fecha de cierre
                  (si no la completás).
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firmaCliente"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma / comprobante del cliente / obra</FormLabel>
                <FormControl>
                  <Input placeholder="URL de firma digital o referencia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="firmaChofer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Firma del chofer / responsable</FormLabel>
                <FormControl>
                  <Input placeholder="URL de firma digital o referencia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notificar y fecha cierre */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="notificarA"
            render={() => (
              <FormItem>
                <FormLabel>Notificar a</FormLabel>
                <div className="mt-2 space-y-2">
                  {NOTIFICAR_A_OPTS.map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedNotificarA.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          const isChecked = checked === true;
                          const current = selectedNotificarA;

                          form.setValue(
                            "notificarA",
                            isChecked
                              ? Array.from(new Set([...current, opt.value]))
                              : current.filter((v) => v !== opt.value),
                          );
                        }}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Estas áreas pueden recibir la notificación al registrar/actualizar la entrega.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaCierreEntrega"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de cierre de entrega</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Si está vacío y el estado es <strong>Entregado</strong>, se completa automáticamente al guardar.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">Guardar logística</Button>
        </div>
      </form>
    </Form>
  );
}
