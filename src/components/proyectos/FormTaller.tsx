"use client";

import * as z from 'zod';
import { IProyecto } from '@/models/Proyecto';
import { ProcesoFormWrapper } from './ProcesoFormWrapper';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigurableSelect } from '../ui/ConfigurableSelect';

// 1. Definir Schema
const tallerSchema = z.object({
  asignadoA: z.string().optional(),
  fechaIngreso: z.date().optional(),
  fechaEstimadaFinalizacion: z.date().optional(),
  
  tipoAbertura: z.string().optional(),
  materialPerfil: z.string().optional(),
  tipoPerfil: z.string().optional(),
  color: z.string().optional(),
  vidrioAColocar: z.string().optional(),
  
  accesoriosCompletos: z.string().optional(),
  materialDisponible: z.string().optional(),
  materialObs: z.string().optional(),
  
  medidasVerificadas: z.string().optional(),
  planosVerificados: z.string().optional(),
  
  estadoInterno: z.string().optional(),
  informeTaller: z.string().optional(),
  evidenciasArmado: z.array(z.string()).optional(), // TODO: FileUpload
  
  controlCalidadPor: z.string().optional(),
  fechaControlCalidad: z.date().optional(),

  // Regla de Pase
  pedidoListoParaEntrega: z.string().optional(),
  destinoFinal: z.string().optional(),
});

type FormValues = z.infer<typeof tallerSchema>;

interface Props {
  proyecto: IProyecto;
}

export function FormTaller({ proyecto }: Props) {
  return (
    <ProcesoFormWrapper<FormValues>
      proyecto={proyecto}
      etapaKey="taller"
      tituloEtapa="Taller"
      validationSchema={tallerSchema}
    >
      {(form, esCompletado) => {
        const materialPerfil = form.watch('materialPerfil');
        
        return (
          <>
            {/* Columna 1 */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="asignadoA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnico de Taller</FormLabel>
                    <FormControl>
                      {/* TODO: Select de usuarios de Taller */}
                      <Input {...field} disabled={esCompletado} placeholder="ID Técnico" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="materialPerfil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material de Perfil</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={esCompletado}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Aluminio">Aluminio</SelectItem>
                        <SelectItem value="PVC">PVC</SelectItem>
                        <SelectItem value="Mixto">Mixto</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {/* CAMPO CONDICIONAL */}
              {materialPerfil === 'Aluminio' && (
                <FormField
                  control={form.control}
                  name="tipoPerfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil Aluminio</FormLabel>
                      <FormControl>
                        <ConfigurableSelect tipo="perfilAluminio" value={field.value || ""} onChange={field.onChange} disabled={esCompletado} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              {materialPerfil === 'PVC' && (
                <FormField
                  control={form.control}
                  name="tipoPerfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil PVC</FormLabel>
                      <FormControl>
                        <ConfigurableSelect tipo="perfilPvc" value={field.value || ""} onChange={field.onChange} disabled={esCompletado} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              {(materialPerfil === 'Mixto' || materialPerfil === 'Otro') && (
                <FormField
                  control={form.control}
                  name="tipoPerfil"
                  render={({ field }) => (
                    <FormItem><FormLabel>Perfil (Mixto/Otro)</FormLabel><FormControl><Input {...field} disabled={esCompletado} /></FormControl></FormItem>
                  )}
                />
              )}
            </div>

            {/* Columna 2 */}
            <div className="space-y-4">
               <FormField
                control={form.control}
                name="estadoInterno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado de Taller</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={esCompletado}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="En proceso">En proceso</SelectItem>
                        <SelectItem value="Completo">Completo</SelectItem>
                        <SelectItem value="En espera">En espera</SelectItem>
                        <SelectItem value="Revisión">Revisión</SelectItem>
                        <SelectItem value="Rechazado">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="informeTaller"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informe de Taller</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={5} disabled={esCompletado} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Columna 3 - Regla de Pase */}
            <div className="space-y-4 p-4 rounded-lg border border-gray-300 dark:border-gray-700">
              <h3 className="font-semibold">Finalización</h3>
              <FormField
                control={form.control}
                name="pedidoListoParaEntrega"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido Listo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={esCompletado}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Sí">Sí</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="En revisión">En revisión</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destinoFinal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enviar A:</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={esCompletado}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Depósito">Depósito</SelectItem>
                        <SelectItem value="Logística">Logística (Entrega directa)</SelectItem>
                        <SelectItem value="Instalación">Instalación en obra</SelectItem>
                        <SelectItem value="Retiro Cliente">Retiro por cliente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
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