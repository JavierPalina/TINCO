"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "../ui/button";

export function UserNav() {
    const { data: session } = useSession();

    if (session) {
        return (
            <div className="hidden md:flex items-center gap-6">
                <p>Hola, {session.user?.name}</p>
                <Button onClick={() => signOut({ callbackUrl: '/login' })} variant="outline">
                    Cerrar Sesión
                </Button>
            </div>
        )
    }

    return <Button onClick={() => window.location.href = '/login'}>Iniciar Sesión</Button>
}