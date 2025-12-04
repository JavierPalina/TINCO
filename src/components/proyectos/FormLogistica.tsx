"use client";

import * as z from 'zod';
import { IProyecto } from '@/models/Proyecto';
import { ProcesoFormWrapper } from './ProcesoFormWrapper';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SignaturePad } from '../ui/SignaturePad';

// 1. Definir Schema
const logisticaSchema = z.object({
  asignadoA: z.string().optional(), // Chofer
  fechaProgramada: z.date().optional(),
  
  tipoEntrega: z.string().optional(),
  medioTransporte: z.string().optional(),
  estadoPedidoRecibido: z.string().optional(),
  verificacionEmbalaje: z.string().optional(),
  cantidadBultos: z.coerce.number().optional(),
  
  horaSalida: z.string().optional(),
  horaLlegada: z.string().optional(),
  
  responsableRecibeNombre: z.string().optional(),
  firmaCliente: z.string().optional(),
  firmaChofer: z.string().optional(),
  
  evidenciaEntrega: z.array(z.string()).optional(),
  informeLogistica: z.string().optional(),
  
  estadoEntrega: z.string().optional(),
  fechaCierreEntrega: z.date().optional(),
});

type FormValues = z.infer<typeof logisticaSchema>;

interface Props {
  proyecto: IProyecto;
}

export function FormLogistica({ proyecto }: Props) {
  return (
    <ProcesoFormWrapper<FormValues>
      proyecto={proyecto}
      etapaKey="logistica"
      tituloEtapa="Logística"
      validationSchema={logisticaSchema}
    >
      {(form, esCompletado) => (
        <>
          {/* Columna 1 */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="asignadoA"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsable / Chofer</FormLabel>
                  <FormControl>
                    {/* TODO: Select de Usuarios */}
                    <Input {...field} disabled={esCompletado} placeholder="ID Chofer" />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* TODO: DatePicker para fechaProgramada */}
            <FormField
              control={form.control}
              name="tipoEntrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Entrega</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={esCompletado}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Entrega a obra">Entrega a obra</SelectItem>
                      <SelectItem value="Retiro en fábrica">Retiro en fábrica</SelectItem>
                      <SelectItem value="Instalación directa">Instalación directa</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estadoEntrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado de la Entrega</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={esCompletado}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Entregado">Entregado (Completa el proyecto)</SelectItem>
                      <SelectItem value="Parcial">Parcial</SelectItem>
                      <SelectItem value="Rechazado">Rechazado</SelectItem>
                      <SelectItem value="Reprogramado">Reprogramado</SelectItem>
                      <SelectItem value="Pendiente">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          {/* Columna 2 */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="responsableRecibeNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de quien recibe</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={esCompletado} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firmaCliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma del Cliente</FormLabel>
                  <FormControl>
                    <SignaturePad
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={esCompletado}
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
              name="informeLogistica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Informe de Logística</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} disabled={esCompletado} />
                  </FormControl>
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="firmaChofer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma del Chofer</FormLabel>
                  <FormControl>
                    <SignaturePad
                      value={field.value || ""}
                      onChange={field.onChange}
                      disabled={esCompletado}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </ProcesoFormWrapper>
  );
}