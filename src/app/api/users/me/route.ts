import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User";
import { z } from "zod";

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

function normalizeEmptyToNull<T>(value: T): T {
  // Convierte "" => null dentro de objetos (solo strings)
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return (value.trim() === "" ? (null as any) : value) as any;
  if (Array.isArray(value)) return value.map(normalizeEmptyToNull) as any;
  if (typeof value === "object") {
    const obj: any = value;
    const out: any = {};
    for (const k of Object.keys(obj)) out[k] = normalizeEmptyToNull(obj[k]);
    return out;
  }
  return value;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const user = await UserModel.findById(session.user.id).lean();
  if (!user || Array.isArray(user)) return new NextResponse("No encontrado", { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      _id: (user as any)._id,
      name: (user as any).name ?? null,
      email: (user as any).email ?? null,
      rol: (user as any).rol,
      activo: (user as any).activo,
      image: (user as any).image ?? null,

      personalData: (user as any).personalData ?? {},
      contactData: (user as any).contactData ?? {},
      laboralData: (user as any).laboralData ?? {},
      financieraLegalData: (user as any).financieraLegalData ?? {},
    },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  const raw = await req.json();
  const parsed = updateSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = normalizeEmptyToNull(parsed.data);

  // whitelist explícita
  const $set: Record<string, unknown> = {};

  if (body.name !== undefined) $set["name"] = body.name;
  if (body.image !== undefined) $set["image"] = body.image;

  if (body.personalData !== undefined) $set["personalData"] = body.personalData;
  if (body.contactData !== undefined) $set["contactData"] = body.contactData;
  if (body.laboralData !== undefined) $set["laboralData"] = body.laboralData;
  if (body.financieraLegalData !== undefined) $set["financieraLegalData"] = body.financieraLegalData;

  const updated = await UserModel.findByIdAndUpdate(session.user.id, { $set }, { new: true }).lean();
  if (!updated || Array.isArray(updated)) return new NextResponse("No encontrado", { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      _id: (updated as any)._id,
      name: (updated as any).name ?? null,
      email: (updated as any).email ?? null,
      rol: (updated as any).rol,
      image: (updated as any).image ?? null,
      personalData: (updated as any).personalData ?? {},
      contactData: (updated as any).contactData ?? {},
      laboralData: (updated as any).laboralData ?? {},
      financieraLegalData: (updated as any).financieraLegalData ?? {},
    },
  });
}
