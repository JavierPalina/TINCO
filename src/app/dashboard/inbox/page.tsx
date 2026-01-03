"use client";

import React from "react";
import Link from "next/link";
import {
  Mail,
  Inbox as InboxIcon,
  Send,
  ShieldCheck,
  Search,
  Tag,
  Paperclip,
  Users,
  Building2,
  ArrowRight,
  Globe,
  CheckCircle2,
  Zap,
} from "lucide-react";

import { Footer } from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function InboxServicePage() {
  return (
    <main className="relative">

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
              Servicio: Email & Chat
            </Badge>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Inbox: correo corporativo dentro de <span className="text-primary">Tinco</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Comprá y administrá dominios, creá cuentas de mail y operá tu bandeja de entrada/salida sin salir del
              sistema. Integración con clientes, proyectos y notificaciones.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="/dashboard/dominios">
                  Comprar / Configurar dominio <Globe className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="#alcance">Ver alcance</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="rounded-full">Envío + Recepción</Badge>
              <Badge variant="outline" className="rounded-full">Cuentas y alias</Badge>
              <Badge variant="outline" className="rounded-full">Antispam / seguridad</Badge>
              <Badge variant="outline" className="rounded-full">Búsqueda y etiquetas</Badge>
            </div>
          </div>

          {/* HERO CARD */}
          <Card className="relative overflow-hidden border bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl md:text-2xl">¿Qué vas a poder hacer?</CardTitle>
              <CardDescription>
                Operación diaria + administración, con trazabilidad y orden.
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3">
              {[
                { icon: InboxIcon, title: "Bandeja unificada", desc: "Inbox/Sent/Drafts con filtros y estados." },
                { icon: Send, title: "Enviar correos", desc: "Plantillas, firmas, adjuntos y CC/BCC." },
                { icon: Search, title: "Búsqueda potente", desc: "Por asunto, remitente, cliente, tags y fechas." },
                { icon: ShieldCheck, title: "Seguridad y entregabilidad", desc: "SPF/DKIM/DMARC, antispam y logs." },
                { icon: Tag, title: "Etiquetas y automatizaciones", desc: "Reglas: etiquetar, asignar, archivar, SLA." },
                { icon: Users, title: "Buzones compartidos", desc: "ventas@, soporte@, operaciones@ con permisos." },
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
                <p className="text-sm font-semibold">Ideas extra (alto valor)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Vincular mails a Clientes/Proyectos, “Enviar desde etapa”, recordatorios de seguimiento,
                  métricas por buzón (respuesta, SLA), y auditoría por usuario.
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Beneficios</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Menos herramientas, más control. Email integrado al flujo real del negocio.
            </p>
          </div>

          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Enfoque: operación + auditoría
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Respuesta más rápida",
              desc: "Plantillas, etiquetas y asignaciones para bajar el tiempo de respuesta.",
            },
            {
              icon: Paperclip,
              title: "Contexto al instante",
              desc: "Adjuntos, historial y vínculo con cliente/proyecto sin buscar en 3 sistemas.",
            },
            {
              icon: ShieldCheck,
              title: "Cumplimiento y trazabilidad",
              desc: "Logs, permisos por buzón y controles de seguridad para el dominio.",
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
            <CardTitle className="text-xl md:text-2xl">Cómo se activa</CardTitle>
            <CardDescription>
              El Inbox depende de dominios correctamente configurados (DNS). Por eso el paso 1 es Dominios.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              { n: "1", t: "Comprar / vincular dominio", d: "Alta de dominio y verificación de propiedad." },
              { n: "2", t: "Configurar DNS", d: "MX + SPF + DKIM + DMARC (asistido)." },
              { n: "3", t: "Crear cuentas y buzones", d: "Usuarios, alias y buzones compartidos." },
              { n: "4", t: "Operar desde Inbox", d: "Enviar, recibir, reglas, auditoría y reportes." },
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
              Qué incluye Inbox, qué depende del dominio y qué se puede automatizar.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿Se puede usar un dominio existente?</AccordionTrigger>
              <AccordionContent>
                Sí. Podés vincular un dominio ya comprado y configurar DNS. El asistente te guía con los registros.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>¿Se pueden crear buzones compartidos?</AccordionTrigger>
              <AccordionContent>
                Sí. Por ejemplo ventas@, soporte@. Se manejan permisos por rol y se audita actividad.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>¿Incluye antispam y entregabilidad?</AccordionTrigger>
              <AccordionContent>
                La base es SPF/DKIM/DMARC + políticas. Además podés sumar reglas y listas seguras/bloqueos.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>¿Se puede vincular a clientes/proyectos?</AccordionTrigger>
              <AccordionContent>
                Sí. Recomendado: que cada hilo quede asociado a un Cliente o Proyecto para trazabilidad total.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16" id="cta">
        <Card className="border bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Siguiente paso
                </Badge>
                <h4 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Configurá tu dominio y activá Inbox
                </h4>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                  Primero Dominios (DNS + verificación), luego creás cuentas y ya podés operar desde la bandeja.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/dashboard/dominios">
                    Ir a Dominios <ArrowRight className="h-4 w-4" />
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
              <p className="text-sm font-semibold">Checklist rápido</p>
              <p className="text-sm text-muted-foreground mt-1">
                Dominio verificado, MX configurado, SPF/DKIM/DMARC activos, al menos 1 buzón creado y permisos por rol.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  );
}
