import Link from "next/link";
import { UserNav } from "../auth/UserNav";
import { NotificationBell } from "./NotificationBell"; // <-- 1. IMPORTAR

export function Header() {
    return (
        <header className="p-4 border-b bg-background sticky top-0 z-10">
            <nav className="container mx-auto flex justify-between items-center">
                <div className="flex gap-6 items-center">
                    <Link href="/dashboard/pipeline" className="font-bold text-lg">CRM</Link>
                    <Link href="/dashboard/pipeline" className="text-sm text-muted-foreground hover:text-primary">Pipeline</Link>
                    <Link href="/dashboard/clientes" className="text-sm text-muted-foreground hover:text-primary">Clientes</Link>
                    <Link href="/dashboard/tareas" className="text-sm text-muted-foreground hover:text-primary">Mis Tareas</Link>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationBell /> {/* <-- 2. AÑADIR EL COMPONENTE */}
                    <UserNav />
                </div>
            </nav>
        </header>
    )
}