import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Archivo inválido" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const unique = `${Date.now()}_${Math.random().toString(16).slice(2)}_${safeName}`;
  const outPath = path.join(uploadsDir, unique);

  await fs.writeFile(outPath, buffer);

  // URL pública
  const url = `/uploads/${unique}`;
  return NextResponse.json({ success: true, url });
}
