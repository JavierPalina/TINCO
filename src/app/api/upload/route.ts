import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises'; // <-- 1. Importar mkdir
import { join } from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const files: File[] = data.getAll('files') as unknown as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ success: false, error: "No se subieron archivos." }, { status: 400 });
  }

  const filePaths: string[] = [];
  // 2. Definimos la ruta del directorio
  const cotizacionesDir = join(process.cwd(), 'public', 'cotizaciones');

  try {
    // 3. Nos aseguramos de que el directorio exista. Si no, lo crea.
    // { recursive: true } evita errores si la carpeta ya existe.
    await mkdir(cotizacionesDir, { recursive: true });
  } catch (error) {
    console.error("Error al crear el directorio:", error);
    return NextResponse.json({ success: false, error: "No se pudo crear el directorio de subida." }, { status: 500 });
  }

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const path = join(cotizacionesDir, uniqueFilename);
    
    try {
      await writeFile(path, buffer);
      filePaths.push(`/cotizaciones/${uniqueFilename}`);
    } catch (error) {
      console.error("Error al guardar archivo:", error);
      return NextResponse.json({ success: false, error: "Error al guardar el archivo." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, paths: filePaths });
}