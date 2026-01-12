import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Empresa from "@/models/Empresa";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type EmpresaMatch = Record<string, unknown> & {
  $or?: Array<Record<string, unknown>>;
};

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const qRaw = (searchParams.get("q") || "").trim();

    const match: EmpresaMatch = {};

    if (qRaw) {
      const safe = escapeRegex(qRaw);
      const rx = new RegExp(safe, "i");

      match.$or = [
        { razonSocial: { $regex: rx } },
        { nombreFantasia: { $regex: rx } },
        { cuit: { $regex: rx } },
      ];
    }

    const empresas = await Empresa.find(match)
      .select({ razonSocial: 1, nombreFantasia: 1, cuit: 1 })
      .sort({ razonSocial: 1 })
      .limit(200)
      .lean();

    return NextResponse.json({ success: true, data: empresas });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
