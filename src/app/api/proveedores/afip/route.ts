import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// Acá vas a conectar tu integración real con ARCA/AFIP
async function fetchAfipDataByCuit(_cuit: string) {
  // TODO: implementar con tu proveedor/servicio (credenciales, tokens, etc)
  return null;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cuit = (searchParams.get("cuit") || "").trim();

  if (!cuit) {
    return NextResponse.json({ success: false, error: "CUIT requerido" }, { status: 400 });
  }

  const data = await fetchAfipDataByCuit(cuit);

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Sin datos (integración no configurada)" },
      { status: 501 }
    );
  }

  return NextResponse.json({ success: true, data });
}
