import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { ObjectId } from 'mongodb'; // Importar ObjectId para validación

// Endpoint para obtener un usuario por ID
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'ID de usuario inválido.' }, { status: 400 });
        }
        const user = await User.findById(id).select('-password'); // Excluimos el password por seguridad
        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: user });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

// Endpoint para actualizar un usuario por ID
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'ID de usuario inválido.' }, { status: 400 });
        }
        const body = await req.json();
        const user = await User.findByIdAndUpdate(id, body, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: user });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }
}

// Endpoint para eliminar un usuario por ID
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    try {
        const { id } = await params;
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: 'ID de usuario inválido.' }, { status: 400 });
        }
        const deletedUser = await User.deleteOne({ _id: id });
        if (deletedUser.deletedCount === 0) {
            return NextResponse.json({ success: false, error: 'Usuario no encontrado.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: {} });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error.';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
