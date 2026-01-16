// src/app/api/role-access/route.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RoleAccessModel from "@/models/RoleAccess";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Error del servidor";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  await dbConnect();

  try {
    const data = await RoleAccessModel.find({}).lean();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, message: getErrorMessage(error) }, { status: 500 });
  }
}
