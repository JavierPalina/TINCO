"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  ShieldCheck,
  Settings,
  KeyRound,
  Server,
  CheckCircle2,
  ArrowRight,
  Mail,
  Building2,
  Zap,
  FileKey,
  Users,
} from "lucide-react";

import { Footer } from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function DominiosPage() {
  return (
    <main className="relative">

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-48 left-[-120px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.08),transparent_55%)]" />
      </div>

      {/* HERO */}
      <section className="container mx-auto px-4 pt-14 pb-8 md:pt-20 md:pb-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Servicio: Dominios
            </Badge>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Dominios & configuración de email para <span className="text-primary">Inbox</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Comprá o vinculá dominios, configurá DNS y activá seguridad de correo (SPF/DKIM/DMARC).
              Base necesaria para cuentas corporativas y operación desde Inbox.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="#activar">
                  Activar dominio <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/dashboard/inbox">
                  Ir a Inbox <Mail className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="rounded-full">Compra / vínculo</Badge>
              <Badge variant="outline" className="rounded-full">DNS asistido</Badge>
              <Badge variant="outline" className="rounded-full">SPF / DKIM / DMARC</Badge>
              <Badge variant="outline" className="rounded-full">Permisos por rol</Badge>
            </div>
          </div>

          {/* HERO CARD */}
          <Card className="relative overflow-hidden border bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl md:text-2xl">Incluye</CardTitle>
              <CardDescription>Todo lo necesario para que el correo “llegue bien” y sea administrable.</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3">
              {[
                { icon: Globe, title: "Alta de dominio", desc: "Compra o vínculo de dominios existentes." },
                { icon: Server, title: "DNS guiado", desc: "MX, TXT, CNAME con validación automática." },
                { icon: FileKey, title: "SPF / DKIM / DMARC", desc: "Seguridad y entregabilidad." },
                { icon: KeyRound, title: "Verificación de propiedad", desc: "Prueba de control del dominio." },
                { icon: Users, title: "Cuentas y alias", desc: "Usuarios, aliases, y buzones compartidos." },
                { icon: Settings, title: "Políticas", desc: "Reglas, permisos y auditoría." },
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
                <p className="text-sm font-semibold">Sugerencia de producto</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Si tu objetivo es vender más, conviene crear: ventas@, presupuestos@, soporte@ y configurar
                  buzones compartidos con SLA y trazabilidad.
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
      <section className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Beneficios</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
              Mejor entregabilidad, menos problemas y más control desde el sistema.
            </p>
          </div>

          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Enfoque: seguridad + entregabilidad
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Menos spam",
              desc: "SPF/DKIM/DMARC correctamente configurados reducen rechazo y spoofing.",
            },
            {
              icon: Zap,
              title: "Activación rápida",
              desc: "Checklist + validación de DNS para acortar la puesta en marcha.",
            },
            {
              icon: Settings,
              title: "Gobernanza",
              desc: "Permisos por rol, auditoría y políticas por dominio/buzón.",
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
      <section className="container mx-auto px-4 pb-10 md:pb-14" id="activar">
        <Card className="border bg-card/60 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Pasos para activar un dominio</CardTitle>
            <CardDescription>Proceso estándar para dejar Inbox listo para operar.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              { n: "1", t: "Elegir dominio", d: "Comprar o vincular uno existente." },
              { n: "2", t: "Verificar", d: "Validar propiedad con registro TXT." },
              { n: "3", t: "Configurar DNS", d: "MX + SPF + DKIM + DMARC." },
              { n: "4", t: "Crear buzones", d: "Cuentas, alias, compartidos y permisos." },
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
              DNS, verificación y seguridad del correo.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿Qué registros DNS necesito?</AccordionTrigger>
              <AccordionContent>
                Como mínimo MX para recepción y TXT para SPF. Recomendado: DKIM y DMARC para seguridad y reputación.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>¿Cuánto tarda en impactar el DNS?</AccordionTrigger>
              <AccordionContent>
                Depende del TTL del proveedor. Generalmente minutos a horas. El sistema puede revalidar automáticamente.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>¿Puedo delegar permisos por dominio?</AccordionTrigger>
              <AccordionContent>
                Sí. Podés definir quién administra DNS/usuarios/buzones y quién sólo opera Inbox.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>¿Se puede usar con varios dominios?</AccordionTrigger>
              <AccordionContent>
                Sí. Por ejemplo, una empresa con varias marcas puede administrar múltiples dominios desde el panel.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="border bg-gradient-to-br from-primary/10 via-transparent to-transparent">
          <CardContent className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  Continuar
                </Badge>
                <h4 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Dominio listo, ahora a operar con Inbox
                </h4>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                  Una vez validado el DNS, podés crear buzones y usar el correo dentro de Tinco.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/dashboard/inbox">
                    Ir a Inbox <ArrowRight className="h-4 w-4" />
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
              <p className="text-sm font-semibold">Recomendación</p>
              <p className="text-sm text-muted-foreground mt-1">
                Activá DMARC en modo “quarantine” al inicio y luego “reject” cuando tengas DKIM/SPF validados al 100%.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  );
}
