"use client";

import React from "react";
import Link from "next/link";
import {
  Bot,
  MessageCircle,
  Workflow,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Building2,
  Users,
  FileText,
  BarChart3,
  Phone,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ChatbotWppIaPage() {
  return (
    <main className="relative">
      <Header />

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-[-140px] h-[520px] w-[720px] rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute -bottom-48 left-[-120px] h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,120,120,0.08),transparent_55%)]" />
      </div>

      {/* HERO */}
      <section className="container mx-auto px-4 pt-14 pb-8 md:pt-20 md:pb-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-5">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              Servicio: IA + WhatsApp
            </Badge>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Chatbot WPP IA para ventas de <span className="text-primary">aberturas</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Un asistente que conversa por WhatsApp, califica leads, toma medidas/requisitos, cotiza (según reglas),
              agenda visitas y actualiza estados en tu sistema Tinco.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link href="#alcance">
                  Ver alcance <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link href="/dashboard/pipeline">
                  Ver Pipeline
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="rounded-full">Calificación de leads</Badge>
              <Badge variant="outline" className="rounded-full">Captura de requisitos</Badge>
              <Badge variant="outline" className="rounded-full">Integración con CRM/Pipeline</Badge>
              <Badge variant="outline" className="rounded-full">Métricas y auditoría</Badge>
            </div>
          </div>

          {/* HERO CARD */}
          <Card className="relative overflow-hidden border bg-card/60 backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl md:text-2xl">Qué hace el bot</CardTitle>
              <CardDescription>Automatiza el primer contacto sin perder control ni trazabilidad.</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3">
              {[
                { icon: MessageCircle, title: "Atiende 24/7", desc: "Responde consultas y deriva casos complejos." },
                { icon: Users, title: "Califica y segmenta", desc: "Tipo de obra, urgencia, presupuesto, ubicación." },
                { icon: FileText, title: "Recolecta datos", desc: "Medidas, colores, tipo de abertura, fotos, etc." },
                { icon: Workflow, title: "Crea/actualiza oportunidades", desc: "Pipeline, tareas y próximos pasos en Tinco." },
                { icon: Phone, title: "Escalamiento a humano", desc: "Handoff a ventas con contexto completo." },
                { icon: ShieldCheck, title: "Control y auditoría", desc: "Logs por conversación y acciones ejecutadas." },
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
                <p className="text-sm font-semibold">Modo “Ventas de aberturas”</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Flujos guiados por tipo (ventanas/puertas), material, apertura, medidas, herrajes, instalación,
                  urgencia y envío de presupuesto.
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
              Menos fricción en el primer contacto, más oportunidades calificadas y seguimiento automático.
            </p>
          </div>

          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Enfoque: conversión + eficiencia
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Más leads atendidos",
              desc: "Respuesta inmediata y captura estructurada, incluso fuera de horario.",
            },
            {
              icon: BarChart3,
              title: "Mejor conversión",
              desc: "Calificación temprana y handoff con contexto aumenta cierres.",
            },
            {
              icon: ShieldCheck,
              title: "Control total",
              desc: "Reglas, permisos, auditoría y límites de acciones automáticas.",
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
            <CardTitle className="text-xl md:text-2xl">Cómo se implementa</CardTitle>
            <CardDescription>
              Definimos los flujos de ventas de aberturas y conectamos acciones al sistema.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 md:grid-cols-4">
            {[
              { n: "1", t: "Descubrimiento", d: "Preguntas clave, objeciones, políticas y tipos de productos." },
              { n: "2", t: "Flujos & prompts", d: "Árbol de conversación + extracción de datos (medidas/fotos)." },
              { n: "3", t: "Integración Tinco", d: "Crear lead, oportunidad, tareas, etapas, notificaciones." },
              { n: "4", t: "Go-live & mejora", d: "Monitoreo, métricas, entrenamiento y optimización continua." },
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
              IA, límites, datos y control operativo.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿El bot puede cotizar?</AccordionTrigger>
              <AccordionContent>
                Puede cotizar si definís reglas o tablas (por ejemplo por tipo, medidas y extras). En casos complejos,
                deriva a un vendedor con el contexto capturado.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>¿Cómo se evita que haga cosas indebidas?</AccordionTrigger>
              <AccordionContent>
                Se definen permisos/acciones permitidas (crear lead, agendar, cambiar etapa) y todo queda auditado
                con logs. También se pueden poner “guardrails” por tipo de consulta.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>¿Se integra con el pipeline de Tinco?</AccordionTrigger>
              <AccordionContent>
                Sí. Crea/actualiza oportunidades, tareas y próximos pasos, y notifica al equipo correspondiente.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>¿Se pueden ver métricas?</AccordionTrigger>
              <AccordionContent>
                Sí. Conversaciones, leads creados, derivaciones a humano, motivos de pérdida y tiempos de respuesta.
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
                  Implementación
                </Badge>
                <h4 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Activá el bot y conectalo a tu flujo comercial
                </h4>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                  Definimos el guion, los datos a recolectar y los puntos de handoff. Luego integramos con Tinco.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/dashboard/pipeline">
                    Ver Pipeline <ArrowRight className="h-4 w-4" />
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
              <p className="text-sm font-semibold">Tip para arrancar rápido</p>
              <p className="text-sm text-muted-foreground mt-1">
                Definí 10 preguntas imprescindibles para calificar (ubicación, tipo, medidas, urgencia, instalación,
                fotos, presupuesto, etc.) y 5 salidas posibles (cotiza, agenda, deriva, descarta, seguimiento).
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </main>
  );
}
