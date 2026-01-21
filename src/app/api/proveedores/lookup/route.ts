// /app/api/proveedores/lookup/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cuit = (searchParams.get("cuit") ?? "").replace(/\D/g, "");

  if (cuit.length !== 11) {
    return NextResponse.json({ error: "CUIT inválido" }, { status: 400 });
  }

  // TODO: reemplazar por tu lógica real:
  // 1) buscar en DB por cuit
  // 2) si no existe, consultar servicio externo
  // 3) mapear a este formato
  const data = {
    razonSocial: "",
    nombreFantasia: "",
    domicilio: "",
    localidad: "",
    provincia: "",
    codigoPostal: "",
    categoriaIVA: "",
    telefono: "",
    email: "",
  };

  return NextResponse.json({ data });
}
