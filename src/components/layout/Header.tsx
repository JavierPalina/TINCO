"use client"; // Necesitamos que sea un componente de cliente para usar hooks

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { UserNav } from "../auth/UserNav";
import { NotificationBell } from "./NotificationBell";
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react'; // Iconos para el menú móvil
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="p-4 border-b bg-background sticky top-0 z-50">
      <nav className="container mx-auto flex justify-between items-center">
        {/* --- Lado Izquierdo: Logo y Navegación de Escritorio --- */}
        <div className="flex gap-6 items-center">
          <Link href="/dashboard">
            <Image
                src="/logo.png"
                alt="Logo de la Empresa"
                width={80} // Ajustamos un poco el tamaño para el nav
                height={80}
                priority
                className="w-auto h-8" // Usamos clases para controlar el tamaño final
            />
          </Link>
          {/* Navegación para pantallas medianas y grandes (md y superior) */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard/pipeline" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pipeline</Link>
            <Link href="/dashboard/clientes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Clientes</Link>
            <Link href="/dashboard/tareas" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Mis Tareas</Link>
          </div>
        </div>

        {/* --- Lado Derecho: Iconos y Menú Móvil --- */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <UserNav />

          {/* Menú de Hamburguesa para pantallas pequeñas (se oculta en md y superior) */}
          <div className="md:hidden">
            <DropdownMenu onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/pipeline">Pipeline</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/clientes">Clientes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/tareas">Mis Tareas</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  )
}