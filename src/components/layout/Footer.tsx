"use client";

import React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Tinco Services</p>
            <p className="text-xs text-muted-foreground">
              Plataforma de servicios para operación, ventas y comunicación.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
            <Link href="/dashboard/servicios" className="hover:text-primary transition-colors">Servicios</Link>
            <Link href="/dashboard/configuracion" className="hover:text-primary transition-colors">Configuración</Link>
            <Link href="/dashboard/perfil" className="hover:text-primary transition-colors">Perfil</Link>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Tinco. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Soporte: sistemas / mesa de ayuda.
          </p>
        </div>
      </div>
    </footer>
  );
}
