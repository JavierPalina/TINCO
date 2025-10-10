import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Cliente from '@/models/Cliente';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('No autorizado', { status: 401 });

  await dbConnect();
  try {
    const prioridades = await Cliente.distinct('prioridad');
    
    const filteredPrioridades = prioridades.filter(p => p);

    return NextResponse.json({ success: true, data: filteredPrioridades });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
  }
}