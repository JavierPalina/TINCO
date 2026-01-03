// src/app/servicios/aplicacion-mobile-tinco/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  Smartphone,
  TabletSmartphone,
  Workflow,
  ShieldCheck,
  Zap,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Mail,
  Building2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function AplicacionMobileTincoServicePage() {
  return (
    <main className="relative">
        <Header />
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-48 right-[-120px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.08),transparent_55%)]" />
      </div>

      {/* HERO */}
      <section className="container mx-auto px-4 pt-14 pb-8 md:pt-20 md:pb-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Nuevo servicio
            </Badge>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Aplicación Mobile como servicio para <span className="text-primary">Tinco</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Ofrecé a tus clientes una app iOS/Android conectada a Tinco: acceso rápido,
              experiencia premium y flujos optimizados para campo, ventas o administración.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="#cotizar">
                  Cotizar con Sistemas <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="#alcance">
                  Ver alcance del servicio
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="rounded-full">iOS + Android</Badge>
              <Badge variant="outline" className="rounded-full">Integración con Tinco</Badge>
              <Badge variant="outline" className="rounded-full">UI moderna (shadcn)</Badge>
              <Badge variant="outline" className="rounded-full">Deploy y soporte</Badge>
            </div>
          </div>

          {/* HERO CARD */}
          <Card className="relative overflow-hidden border bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl md:text-2xl">¿Qué incluye?</CardTitle>
              <CardDescription>
                Un paquete modular para salir rápido y escalar cuando lo necesites.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3">
              {[
                { icon: Smartphone, title: "App mobile nativa (RN)", desc: "Experiencia fluida con UI moderna." },
                { icon: Workflow, title: "Conexión a Tinco", desc: "Consumo de APIs, auth y permisos." },
                { icon: ShieldCheck, title: "Seguridad", desc: "Roles, sesión, logs y buenas prácticas." },
                { icon: Wrench, title: "Mantenimiento", desc: "Evolución, fixes y mejoras continuas." },
              ].map((it, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-xl border p-3 bg-background/40">
                  <it.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{it.title}</p>
                    <p className="text-xs text-muted-foreground">{it.desc}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}

              <div className="mt-2 rounded-xl border p-4 bg-background/50">
                <p className="text-sm font-semibold">Ideal para</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Operaciones en campo, técnicos, equipos comerciales, reportes, tableros, tareas,
                  notificaciones y cualquier flujo que hoy se haga desde web.
                </p>
              </div>
            </CardContent>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          </Card>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <Separator />
      </div>

      {/* BENEFICIOS */}
      <section className="container mx-auto px-4 py-10 md:py-14" id="alcance">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Beneficios de sumar mobile a Tinco
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Una app no reemplaza tu sistema: lo potencia. Te acercás al usuario, reducís fricción y ganás velocidad.
            </p>
          </div>

          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Enfoque: velocidad + experiencia
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Más rápido en campo",
              desc: "Acciones clave en 1–2 taps: tareas, estados, uploads, firmas y más.",
            },
            {
              icon: TabletSmartphone,
              title: "Experiencia premium",
              desc: "UI moderna, navegación clara, offline parcial (según alcance) y notificaciones.",
            },
            {
              icon: ShieldCheck,
              title: "Gobernanza y control",
              desc: "Roles, permisos, logs y trazabilidad conectados a Tinco.",
            },
          ].map((b, i) => (
            <Card key={i} className="border bg-card/60 backdrop-blur">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2">
                  <b.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{b.title}</CardTitle>
                </div>
                <CardDescription className="text-sm">{b.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* PROCESO */}
      <section className="container mx-auto px-4 pb-10 md:pb-14">
        <Card className="border bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Cómo cotizamos y avanzamos</CardTitle>
            <CardDescription>
              Para cotizar bien necesitamos revisar alcance, APIs, permisos y flujos. Por eso el contacto inicial es con{" "}
              <span className="font-medium text-foreground">Sistemas</span>.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              { n: "1", t: "Reunión con Sistemas", d: "Objetivo, usuarios, procesos, endpoints y permisos." },
              { n: "2", t: "Definición de alcance", d: "MVP + roadmap (módulos opcionales)." },
              { n: "3", t: "Prototipo UI", d: "Pantallas clave y navegación (shadcn + diseño)." },
              { n: "4", t: "Build, deploy y soporte", d: "Entrega + publicación + mantenimiento." },
            ].map((s, idx) => (
              <div key={idx} className="rounded-xl border p-4 bg-background/40">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {s.n}
                  </div>
                  <p className="font-semibold">{s.t}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{s.d}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-12 md:pb-16">
        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-bold">Preguntas frecuentes</h3>
            <p className="text-sm text-muted-foreground">
              Para que quede claro qué se puede hacer, qué depende de Tinco y qué definimos en la cotización.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿La app se integra con el Tinco actual?</AccordionTrigger>
              <AccordionContent>
                Sí. Se integra consumiendo APIs existentes o nuevas. En la reunión con Sistemas definimos endpoints,
                autenticación, permisos y flujos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>¿Incluye iOS y Android?</AccordionTrigger>
              <AccordionContent>
                Sí. El servicio contempla ambos (según alcance). Para publicación en stores se requiere acceso a cuentas
                de Apple/Google o que las gestione tu organización.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>¿Se puede hacer offline?</AccordionTrigger>
              <AccordionContent>
                Se puede contemplar offline parcial (cache/local) para módulos específicos. Depende del caso de uso y
                se define en el alcance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>¿Cómo es el mantenimiento?</AccordionTrigger>
              <AccordionContent>
                Podemos trabajar por bolsa de horas o plan mensual: mejoras, fixes, nuevas pantallas, performance y
                compatibilidad con cambios de Tinco.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16" id="cotizar">
        <Card className="border bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Cotización
                </Badge>
                <h4 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Contactá a <span className="text-primary">Sistemas</span> para cotizar tu app
                </h4>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                  Para estimar tiempos y costo necesitamos: usuarios/roles, flujos principales, APIs disponibles y
                  funcionalidades críticas (notificaciones, offline, firma, uploads, etc.).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Ajustá estos links a tu realidad */}
                <Button asChild size="lg" className="gap-2">
                  <Link href="/dashboard/inbox?to=sistemas">
                    <Mail className="h-4 w-4" />
                    Escribir a Sistemas
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="gap-2">
                  <Link href="/dashboard">
                    <Building2 className="h-4 w-4" />
                    Volver al Dashboard
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border bg-background/50 p-4">
              <p className="text-sm font-semibold">Tip para acelerar la cotización</p>
              <p className="text-sm text-muted-foreground mt-1">
                Definí 3 cosas: (1) quién usa la app, (2) las 5 acciones más frecuentes, (3) qué datos necesita en cada
                acción. Con eso armamos el MVP.
              </p>
            </div>
          </CardContent>
        </Card>
        </section>
        <Footer />
    </main>
  );
}
