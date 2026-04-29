import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import dbConnect from "@/lib/dbConnect";
import ConfigOpcion from "@/models/ConfigOpcion";

const TIPO = "monedaActiva";
const VALID = ["ARS", "USD"] as const;
type Moneda = (typeof VALID)[number];

export async function GET() {
  await dbConnect();
  const doc = await ConfigOpcion.findOne({ tipo: TIPO }).lean();
  const moneda: Moneda = (doc as { valor?: string } | null)?.valor === "USD" ? "USD" : "ARS";
  return NextResponse.json({ success: true, data: { moneda } });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const rol = (session.user as { rol?: string })?.rol;
  if (rol !== "admin" && rol !== "gerente") {
    return new NextResponse("Sin permiso", { status: 403 });
  }

  await dbConnect();

  try {
    const { moneda } = await request.json();
    if (!VALID.includes(moneda)) {
      return NextResponse.json({ success: false, error: "Moneda inválida" }, { status: 400 });
    }

    await ConfigOpcion.deleteMany({ tipo: TIPO });
    await ConfigOpcion.create({ tipo: TIPO, valor: moneda });

    return NextResponse.json({ success: true, data: { moneda } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
