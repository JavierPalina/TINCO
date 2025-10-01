"use client";

import { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider"; // ✅ usar tu propio hook
import { Menu, X, Search, User, Settings, LogOut, Moon, Sun, UsersRound } from 'lucide-react';
import { useSession, signOut } from "next-auth/react";

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { NotificationBell } from "./NotificationBell";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme(); // ahora accede al hook custom
  const { data: session } = useSession();

  return (
    <header className="p-4 border-b bg-background sticky top-0 z-50 bg-card">
      <nav className="container mx-auto flex justify-between items-center gap-4">
        
        {/* --- IZQUIERDA: Logo + Nav Desktop --- */}
        <div className="flex gap-6 items-center">
          <Link href="/dashboard">
            <Image
              src={resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png"}
              alt="Logo de la Empresa"
              width={80}
              height={80}
              priority
              className="w-auto h-8"
            />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard/pipeline" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pipeline</Link>
            <Link href="/dashboard/clientes" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Clientes</Link>
            <Link href="/dashboard/tareas" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Mis Tareas</Link>
          </div>
        </div>

        {/* --- CENTRO: Searchbar (desktop) --- */}
        <div className="flex-1 max-w-sm hidden md:flex items-center relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar secciones..."
            className="pl-9 w-full"
          />
        </div>

        {/* --- DERECHA: Notificaciones + Menús --- */}
        <div className="flex items-center gap-2">
          <NotificationBell />

          {/* --- Menú de usuario --- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || "https://github.com/shadcn.png"} alt="avatar" />
                  <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || "Usuario"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email || "usuario@ejemplo.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard/perfil">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>

              {/* --- Toggle Theme --- */}
              <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                {resolvedTheme === "dark" ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Tema Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Tema Oscuro</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard/configuracion">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </Link>
              </DropdownMenuItem>

              {session?.user?.rol === "admin" && (
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/users">
                    <UsersRound className="mr-2 h-4 w-4" />
                    <span>Usuarios</span>
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* --- Menú hamburguesa (mobile) --- */}
          <div className="md:hidden">
            <DropdownMenu onOpenChange={setIsMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild><Link href="/dashboard/pipeline">Pipeline</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/clientes">Clientes</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/dashboard/tareas">Mis Tareas</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </header>
  )
}