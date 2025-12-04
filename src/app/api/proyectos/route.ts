// /app/api/proyectos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Proyecto from '@/models/Proyecto';
import Cotizacion from '@/models/Cotizacion';
import { authOptions } from '@/lib/authOptions';
import { getServerSession } from 'next-auth';

// Tipos auxiliares
interface CrearProyectoBody {
  clienteId?: string;
  cotizacionId?: string;
}

interface SessionUserWithId {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// --- GET: OBTENER TODOS LOS PROYECTOS (para la tabla del dashboard) ---
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);

    // antes solo leías "estado"
    const estado = searchParams.get('estado');
    const estadosParam = searchParams.get('estados'); // 👈 nuevo: CSV con varios estados

    const filtro: Record<string, unknown> = {};

    if (estadosParam) {
      // ej: "Visita Técnica,Medición,Verificación"
      const estadosArray = estadosParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (estadosArray.length) {
        filtro.estadoActual = { $in: estadosArray };
      }
    } else if (estado) {
      // compatibilidad con lo que ya tenías
      filtro.estadoActual = estado;
    }

    const proyectos = await Proyecto.find(filtro)
      .populate('cliente', 'nombreCompleto telefono direccion')
      .populate('vendedor', 'name')
      .populate('visitaTecnica.asignadoA', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: proyectos });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}

// --- POST: CREAR UN NUEVO PROYECTO (trigger manual o desde ventas) ---
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const body = (await request.json()) as CrearProyectoBody;
    const { clienteId, cotizacionId } = body;

    if (!clienteId) {
      return NextResponse.json(
        { success: false, error: 'El ID del cliente es requerido' },
        { status: 400 },
      );
    }

    const user = session.user as SessionUserWithId;
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Usuario de sesión sin ID' },
        { status: 400 },
      );
    }

    let vendedorId: string = user.id;

    if (cotizacionId) {
      const cotizacion = await Cotizacion.findById(cotizacionId);
      if (cotizacion && cotizacion.vendedor) {
        // asumimos que vendedor es un ObjectId o string compatible con el esquema de Proyecto
        vendedorId = cotizacion.vendedor.toString();
      }
    }

    const nuevoProyecto = await Proyecto.create({
      cliente: clienteId,
      cotizacion: cotizacionId,
      vendedor: vendedorId,
      estadoActual: 'Visita Técnica',
    });

    return NextResponse.json(
      { success: true, data: nuevoProyecto },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 },
    );
  }
}
