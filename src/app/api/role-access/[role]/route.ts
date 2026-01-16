// src/app/api/role-access/[role]/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoleAccessModel, {
  type SectionKey,
  type ProyectoStageKey,
} from "@/models/RoleAccess";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ role: string }>;
};

type PutBody = {
  sections?: Partial<Record<SectionKey, unknown>>;
  proyectoStages?: Partial<Record<ProyectoStageKey, unknown>>;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Error del servidor";
}

function isUserRole(value: string): value is UserRole {
  return (ROLES as readonly string[]).includes(value);
}

export async function GET(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const { role } = await context.params;
    if (!isUserRole(role)) {
      return NextResponse.json({ ok: false, message: "Rol inválido" }, { status: 400 });
    }

    const doc = await RoleAccessModel.findOne({ role }).lean();
    return NextResponse.json({ ok: true, data: doc ?? null }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(req: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const { role } = await context.params;
    if (!isUserRole(role)) {
      return NextResponse.json({ ok: false, message: "Rol inválido" }, { status: 400 });
    }

    const raw: unknown = await req.json();
    const body = (typeof raw === "object" && raw !== null ? raw : {}) as PutBody;

    const nextSections: Record<string, boolean> = {};
    const nextProyectoStages: Record<string, boolean> = {};

    const allowedSections: SectionKey[] = [
      "pipeline",
      "proyectos",
      "clientes",
      "servicios",
      "stock",
      "users",
      "notificaciones",
    ];

    const allowedStages: ProyectoStageKey[] = ["tareas"];

    for (const key of allowedSections) {
      const v = body.sections?.[key];
      if (typeof v === "boolean") nextSections[key] = v;
    }

    for (const key of allowedStages) {
      const v = body.proyectoStages?.[key];
      if (typeof v === "boolean") nextProyectoStages[key] = v;
    }

    const updated = await RoleAccessModel.findOneAndUpdate(
      { role },
      {
        $set: {
          role,
          ...(Object.keys(nextSections).length ? { sections: nextSections } : {}),
          ...(Object.keys(nextProyectoStages).length ? { proyectoStages: nextProyectoStages } : {}),
        },
      },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ ok: true, data: updated }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}
