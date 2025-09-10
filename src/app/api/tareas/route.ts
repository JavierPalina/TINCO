import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Tarea from '@/models/Tarea';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

// --- GET: Obtener y clasificar todas las tareas del usuario ---
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  await dbConnect();
  try {
    const { searchParams } = new URL(request.url);
    // Usamos la fecha del filtro, o la fecha actual si no se provee
    const fechaSeleccionada = searchParams.get('date') ? parseISO(searchParams.get('date')!) : new Date();

    const startOfSelectedDay = startOfDay(fechaSeleccionada);
    const endOfSelectedDay = endOfDay(fechaSeleccionada);
    const vendedorId = session.user.id;

    const [hoy, vencidas, proximas, completadas] = await Promise.all([
        // Tareas para el día seleccionado que no están completas
        Tarea.find({ vendedorAsignado: vendedorId, fechaVencimiento: { $gte: startOfSelectedDay, $lte: endOfSelectedDay }, completada: false }).populate('cliente', 'nombreCompleto').sort('horaInicio'),
        // Tareas vencidas (fecha anterior a hoy) que no están completas
        Tarea.find({ vendedorAsignado: vendedorId, fechaVencimiento: { $lt: startOfSelectedDay }, completada: false }).populate('cliente', 'nombreCompleto').sort({ fechaVencimiento: -1 }),
        // Próximas tareas (fecha posterior a hoy) que no están completas
        Tarea.find({ vendedorAsignado: vendedorId, fechaVencimiento: { $gt: endOfSelectedDay }, completada: false }).populate('cliente', 'nombreCompleto').sort('fechaVencimiento'),
        // Todas las tareas completadas
        Tarea.find({ vendedorAsignado: vendedorId, completada: true }).populate('cliente', 'nombreCompleto').sort({ fechaVencimiento: -1 }).limit(50)
    ]);

    const data = { hoy, vencidas, proximas, completadas };
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}

// --- POST: Crear una nueva tarea con todos los campos ---
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  await dbConnect();
  try {
    const body = await request.json();
    // Añadimos el vendedor asignado automáticamente
    const tareaData = { ...body, vendedorAsignado: session.user.id };
    const nuevaTarea = await Tarea.create(tareaData);
    return NextResponse.json({ success: true, data: nuevaTarea }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}