import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function GET() {
  await dbConnect();
  try {
    const adminCount = await User.countDocuments({ rol: 'admin' });
    const isFirstAdmin = adminCount < 2; 

    return NextResponse.json({ isFirstAdmin });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}