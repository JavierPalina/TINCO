"use client";

import React, { useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/components/ThemeProvider";
import { useSession, signOut } from "next-auth/react";
import { 
    Menu,
    X,
    Search,
    User,
    Settings,
    LogOut,
    Moon,
    Sun,
    UsersRound,
    Mail,
    Bot,
    Globe,
    ChevronDown,
    CalendarClock,
    Table
} from 'lucide-react';
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

type ListItemProps = {
    href: string;
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
};

const DropdownListItem = ({ href, icon: Icon, title, children }: ListItemProps) => (
    <DropdownMenuItem asChild>
        <Link href={href} className="flex flex-row items-start gap-2 p-2">
            <Icon className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="flex flex-col">
                <p className="text-sm font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{children}</p>
            </div>
        </Link>
    </DropdownMenuItem>
);

export function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { data: session } = useSession();

    return (
        <header className="p-4 border-b bg-background sticky top-0 z-50 bg-card">
            <nav className="container mx-auto flex justify-between items-center gap-4">
                
                {/* LOGO + NAV PRINCIPAL */}
                <div className="flex gap-6 items-center">
                    <Link href="/dashboard/pipeline">
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
                        <Link
                            href="/dashboard/pipeline"
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            Pipeline
                        </Link>

                        {/* PROYECTOS - MISMA UI QUE SERVICIOS */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors p-0 h-auto hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                                >
                                    Proyectos
                                    <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[500px]" align="start">
                                <div className="grid grid-cols-2 gap-2 p-2">
                                    {/* Columna 1: General Proyectos (si querés, acá podés sumar más cosas después) */}
                                    <div className="flex flex-col">
                                        <DropdownMenuLabel className="px-2">
                                            PROYECTOS
                                        </DropdownMenuLabel>
                                        <DropdownListItem
                                            href="/dashboard/proyectos"
                                            icon={Globe}
                                            title="Todos los proyectos"
                                        >
                                            Vista general de todos los proyectos
                                        </DropdownListItem>
                                    </div>

                                    <div className="flex flex-col">
                                        <DropdownMenuLabel className="px-2">
                                            MIS TAREAS
                                        </DropdownMenuLabel>
                                        <DropdownListItem
                                            href="/dashboard/proyectos/tareas/agenda"
                                            icon={CalendarClock}
                                            title="Agenda"
                                        >
                                            Calendario y agenda de visitas
                                        </DropdownListItem>
                                        <DropdownListItem
                                            href="/dashboard/proyectos/tareas"
                                            icon={Table}
                                            title="Tabla"
                                        >
                                            Tabla con listado de visitas
                                        </DropdownListItem>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link
                            href="/dashboard/clientes"
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            Clientes
                        </Link>
                        <Link
                            href="/dashboard/tareas"
                            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                        >
                            Mis Tareas
                        </Link>
                        
                        {/* SERVICIOS (como ya lo tenías) */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="text-sm font-medium p-2 h-auto hover:bg-transparent"
                                >
                                    Servicios
                                    <ChevronDown className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[500px]" align="start">
                                <div className="grid grid-cols-2 gap-2 p-2">
                                    <div className="flex flex-col">
                                        <DropdownMenuLabel className="px-2">EMAIL & CHAT</DropdownMenuLabel>
                                        <DropdownListItem href="/dashboard/inbox" icon={Mail} title="Inbox">
                                            Envío de Mails
                                        </DropdownListItem>
                                        <DropdownListItem href="/dashboard/chatbot" icon={Bot} title="Chatbot WPP IA">
                                            Automatiza con IA
                                        </DropdownListItem>
                                    </div>
                                    <div className="flex flex-col">
                                        <DropdownMenuLabel className="px-2">DOMINIOS</DropdownMenuLabel>
                                        <DropdownListItem href="/dashboard/dominios" icon={Globe} title="Configuración">
                                            Configuración de Dominios
                                        </DropdownListItem>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* BUSCADOR */}
                <div className="flex-1 max-w-sm hidden md:flex items-center relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar secciones..." className="pl-9 w-full" />
                </div>

                {/* NOTIFICACIONES + PERFIL + MENÚ MOBILE */}
                <div className="flex items-center gap-2">
                    <NotificationBell />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={session?.user?.image || "https://github.com/shadcn.png"}
                                        alt="avatar"
                                    />
                                    <AvatarFallback>{session?.user?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {session?.user?.name || "Usuario"}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {session?.user?.email || "usuario@ejemplo.com"}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/perfil">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() =>
                                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                                }
                            >
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
                                <>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Cerrar sesión</span>
                                </>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* MENÚ MOBILE */}
                    <div className="md:hidden">
                        <DropdownMenu onOpenChange={setIsMobileMenuOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                    <span className="sr-only">Abrir menú</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Servicios</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/inbox">Inbox</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/chatbot">Chatbot WPP IA</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/dominios">Config. de Dominios</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/pipeline">Pipeline</Link>
                                </DropdownMenuItem>

                                {/* TODO: acá podés agregar también Agenda/Tabla de visita técnica para mobile */}
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/proyectos/visita-tecnica/agenda">
                                        Visita Técnica - Agenda
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/proyectos/visita-tecnica/tabla">
                                        Visita Técnica - Tabla
                                    </Link>
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
    );
}
