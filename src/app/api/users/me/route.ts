// src/app/api/users/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { z } from "zod";
import type { Types } from "mongoose";

const updateSchema = z.object({
  name: z.string().min(2).max(80).nullable().optional(),
  image: z.string().url().nullable().optional(),

  personalData: z
    .object({
      cuil: z.string().max(20).nullable().optional(),
      fechaNacimiento: z.union([z.string(), z.null()]).optional(), // ISO string o null
      nacionalidad: z.string().max(60).nullable().optional(),
      estadoCivil: z.enum(["soltero", "casado", "divorciado", "viudo"]).nullable().optional(),
      direccion: z
        .object({
          calle: z.string().max(80).nullable().optional(),
          numero: z.string().max(20).nullable().optional(),
          piso: z.string().max(10).nullable().optional(),
          depto: z.string().max(10).nullable().optional(),
          ciudad: z.string().max(80).nullable().optional(),
          provincia: z.string().max(80).nullable().optional(),
          codigoPostal: z.string().max(15).nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),

  contactData: z
    .object({
      telefonoPrincipal: z.string().max(30).nullable().optional(),
      telefonoSecundario: z.string().max(30).nullable().optional(),
      emailPersonal: z.string().email().nullable().optional(),
      contactoEmergencia: z
        .object({
          nombre: z.string().max(80).nullable().optional(),
          parentesco: z.string().max(50).nullable().optional(),
          telefono: z.string().max(30).nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),

  laboralData: z
    .object({
      puesto: z.string().max(80).nullable().optional(),
      fechaIngreso: z.union([z.string(), z.null()]).optional(), // ISO string o null
      equipo: z.string().max(80).nullable().optional(),
      reportaA: z.string().max(80).nullable().optional(),
    })
    .nullable()
    .optional(),

  financieraLegalData: z
    .object({
      cbu: z.string().max(30).nullable().optional(),
      banco: z.string().max(80).nullable().optional(),
      obraSocial: z.string().max(80).nullable().optional(),
      numeroAfiliado: z.string().max(40).nullable().optional(),
    })
    .nullable()
    .optional(),
});

type UpdateBody = z.infer<typeof updateSchema>;

/**
 * Tipo mínimo del usuario en formato lean().
 * Ajustá "rol" si tu UserRole es más estricto (acá lo dejamos string para no acoplar route a roles.ts).
 */
type LeanUser = {
  _id: Types.ObjectId;
  name?: string | null;
  email?: string | null;
  rol: string;
  activo?: boolean;
  image?: string | null;

  personalData?: Record<string, unknown>;
  contactData?: Record<string, unknown>;
  laboralData?: Record<string, unknown>;
  financieraLegalData?: Record<string, unknown>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Convierte strings vacíos => null en objetos anidados.
 * No usa any (solo unknown + type guards).
 */
function normalizeEmptyToNull(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return value.trim() === "" ? null : value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => normalizeEmptyToNull(v));
  }

  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = normalizeEmptyToNull(v);
    }
    return out;
  }

  return value;
}

function toResponseUser(user: LeanUser) {
  return {
    _id: user._id,
    name: user.name ?? null,
    email: user.email ?? null,
    rol: user.rol,
    activo: user.activo ?? true,
    image: user.image ?? null,

    personalData: user.personalData ?? {},
    contactData: user.contactData ?? {},
    laboralData: user.laboralData ?? {},
    financieraLegalData: user.financieraLegalData ?? {},
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const user = (await UserModel.findById(session.user.id).lean()) as LeanUser | null;
  if (!user) return new NextResponse("No encontrado", { status: 404 });

  return NextResponse.json({ success: true, data: toResponseUser(user) });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const raw: unknown = await req.json();
  const parsed = updateSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Normalizamos "" => null sin any
  const normalizedUnknown = normalizeEmptyToNull(parsed.data);

  // Volvemos a asegurar tipo (safe) antes de usar
  const normalizedParsed = updateSchema.safeParse(normalizedUnknown);
  if (!normalizedParsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", details: normalizedParsed.error.flatten() },
      { status: 400 },
    );
  }

  const body: UpdateBody = normalizedParsed.data;

  // whitelist explícita
  const $set: Record<string, unknown> = {};

  if (body.name !== undefined) $set["name"] = body.name;
  if (body.image !== undefined) $set["image"] = body.image;

  if (body.personalData !== undefined) $set["personalData"] = body.personalData;
  if (body.contactData !== undefined) $set["contactData"] = body.contactData;
  if (body.laboralData !== undefined) $set["laboralData"] = body.laboralData;
  if (body.financieraLegalData !== undefined) $set["financieraLegalData"] = body.financieraLegalData;

  const updated = (await UserModel.findByIdAndUpdate(
    session.user.id,
    { $set },
    { new: true },
  ).lean()) as LeanUser | null;

  if (!updated) return new NextResponse("No encontrado", { status: 404 });

  return NextResponse.json({ success: true, data: toResponseUser(updated) });
}
