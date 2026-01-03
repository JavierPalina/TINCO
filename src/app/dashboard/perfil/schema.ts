import { z } from "zod";

export const perfilSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto").max(80).nullable().optional(),
  image: z.string().url().nullable().optional(),

  personalData: z.object({
    cuil: z.string().max(20).nullable().optional(),
    fechaNacimiento: z.string().nullable().optional(), // ISO yyyy-mm-dd
    nacionalidad: z.string().max(60).nullable().optional(),
    estadoCivil: z.enum(["soltero", "casado", "divorciado", "viudo"]).nullable().optional(),
    direccion: z.object({
      calle: z.string().max(80).nullable().optional(),
      numero: z.string().max(20).nullable().optional(),
      piso: z.string().max(10).nullable().optional(),
      depto: z.string().max(10).nullable().optional(),
      ciudad: z.string().max(80).nullable().optional(),
      provincia: z.string().max(80).nullable().optional(),
      codigoPostal: z.string().max(15).nullable().optional(),
    }).optional(),
  }).optional(),

  contactData: z.object({
    telefonoPrincipal: z.string().max(30).nullable().optional(),
    telefonoSecundario: z.string().max(30).nullable().optional(),
    emailPersonal: z.string().email("Email inválido").nullable().optional(),
    contactoEmergencia: z.object({
      nombre: z.string().max(80).nullable().optional(),
      parentesco: z.string().max(50).nullable().optional(),
      telefono: z.string().max(30).nullable().optional(),
    }).optional(),
  }).optional(),

  laboralData: z.object({
    puesto: z.string().max(80).nullable().optional(),
    fechaIngreso: z.string().nullable().optional(), // ISO yyyy-mm-dd
    equipo: z.string().max(80).nullable().optional(),
    reportaA: z.string().max(80).nullable().optional(),
  }).optional(),

  financieraLegalData: z.object({
    cbu: z.string().max(30).nullable().optional(),
    banco: z.string().max(80).nullable().optional(),
    obraSocial: z.string().max(80).nullable().optional(),
    numeroAfiliado: z.string().max(40).nullable().optional(),
  }).optional(),
});

export type PerfilFormValues = z.infer<typeof perfilSchema>;
