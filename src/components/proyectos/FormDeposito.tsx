"use client";

import * as z from "zod";
import { IProyecto } from "@/models/Proyecto";
import { ProcesoFormWrapper } from "./ProcesoFormWrapper";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigurableSelect } from "../ui/ConfigurableSelect";

// 1. Definir Schema
const depositoSchema = z.object({
  asignadoA: z.string().optional(),
  fechaIngreso: z.date().optional(),
  fechaSalida: z.date().optional(),

  origenPedido: z.string().optional(),
  estadoProductoRecibido: z.string().optional(),
  cantidadUnidades: z.coerce.number().optional(),

  ubicacionSeleccion: z.string().optional(),
  ubicacionTexto: z.string().optional(),
  codigoInterno: z.string().optional(),

  verificacionEmbalaje: z.string().optional(),
  materialAlmacenado: z.string().optional(),
  materialAlmacenadoObs: z.string().optional(), // Condicional

  controlMedidasPiezas: z.string().optional(),
  condicionVidrio: z.string().optional(),
  fotosIngreso: z.array(z.string()).optional(),

  estadoInterno: z.string().optional(),
  observaciones: z.string().optional(),
});

type FormValues = z.infer<typeof depositoSchema>;

interface Props {
  proyecto: IProyecto;
}

export function FormDeposito({ proyecto }: Props) {
  return (
    <ProcesoFormWrapper<FormValues>
      proyecto={proyecto}
      etapaKey="deposito"
      tituloEtapa="Depósito"
      validationSchema={depositoSchema}
    >
      {(form, esCompletado) => {
        const materialAlmacenado = form.watch("materialAlmacenado");

        return (
          <>
            {/* Columna 1 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="asignadoA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable de Recepción</FormLabel>
                    <FormControl>
                      {/* TODO: Select de Usuarios */}
                      <Input
                        {...field}
                        disabled={esCompletado}
                        placeholder="ID Usuario"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origenPedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen del Pedido</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={esCompletado}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Taller">Taller</SelectItem>
                        <SelectItem value="Proveedor">Proveedor</SelectItem>
                        <SelectItem value="Devolución">Devolución</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="materialAlmacenado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Almacenado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={esCompletado}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Aluminio">Aluminio</SelectItem>
                        <SelectItem value="PVC">PVC</SelectItem>
                        <SelectItem value="Vidrio">Vidrio</SelectItem>
                        <SelectItem value="Herrajes">Herrajes</SelectItem>
                        <SelectItem value="Otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {materialAlmacenado === "Otros" && (
                <FormField
                  control={form.control}
                  name="materialAlmacenadoObs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especificar &quot;Otros&quot;</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={esCompletado} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="ubicacionSeleccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación (Sector)</FormLabel>
                    <FormControl>
                      <ConfigurableSelect
                        tipo="ubicacionDeposito"
                        value={field.value || ""}
                        onChange={field.onChange}
                        disabled={esCompletado}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ubicacionTexto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación (Detalle)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={esCompletado}
                        placeholder="Estantería 2, Nivel 3"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigoInterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Identificación (Código Interno / Etiqueta)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={esCompletado}
                        placeholder="A01-B03"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Columna 3 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones de Depósito</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={5}
                        disabled={esCompletado}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estadoInterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Actual del Pedido</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={esCompletado}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="En depósito">En depósito</SelectItem>
                        <SelectItem value="Listo para entrega">
                          Listo para entrega (Avanza a Logística)
                        </SelectItem>
                        <SelectItem value="En revisión">En revisión</SelectItem>
                        <SelectItem value="Devolución">Devolución</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </>
        );
      }}
    </ProcesoFormWrapper>
  );
}
