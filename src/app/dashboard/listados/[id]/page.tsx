"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  Mail, Phone, User as UserIcon, Building, Globe, Hash, MapPin,
  Pencil, ArrowLeft, Loader2, CheckCircle2, Clock, AlertCircle,
  FileText, DollarSign, Briefcase, MessageSquare, Star, Calendar,
  ChevronRight, ExternalLink, Image as ImageIcon, Paperclip, Save, X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AddInteractionForm } from "@/components/clientes/AddInteractionForm";
import { AddTaskDialog } from "@/components/tareas/AddTaskDialog";
import { TaskItem } from "@/components/tareas/TaskItem";
import { useCurrency } from "@/context/CurrencyContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Vendedor { _id: string; name: string; email?: string; }

interface ClientData {
  _id: string;
  nombreCompleto: string;
  email?: string;
  telefono: string;
  etapa: string;
  vendedorAsignado: Vendedor;
  empresa?: string;
  empresaAsignada?: { _id: string; razonSocial: string; nombreFantasia?: string };
  direccionEmpresa?: string;
  ciudadEmpresa?: string;
  paisEmpresa?: string;
  razonSocial?: string;
  contactoEmpresa?: string;
  cuil?: string;
  prioridad: string;
  origenContacto?: string;
  direccion?: string;
  pais?: string;
  dni?: string;
  ciudad?: string;
  notas?: string;
  motivoRechazo?: string;
  detalleRechazo?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Cotizacion {
  _id: string;
  codigo: string;
  nombre?: string;
  montoTotal: number;
  etapa?: { _id: string; nombre: string; color?: string };
  tipoObra?: string;
  tipoAbertura?: string;
  comoNosConocio?: string;
  createdAt: string;
  archivos?: { uid: string; url: string; name?: string; publicId?: string }[];
  imagenes?: { uid: string; url: string; caption?: string }[];
  pagos?: { uid: string; monto?: number; fecha?: string; metodo?: string }[];
  facturas?: { uid: string; numero?: string; monto?: number; estado?: string }[];
}

interface Proyecto {
  _id: string;
  numeroOrden: string;
  estadoActual?: string | null;
  createdAt: string;
  vendedor?: { name: string };
  cotizacion?: { codigo: string };
}

interface Interaccion {
  _id: string;
  tipo: string;
  nota: string;
  createdAt: string;
  usuario: Vendedor;
}

interface Nota {
  _id: string;
  contenido: string;
  createdAt: string;
  usuario: { name: string };
}

interface Tarea {
  _id: string;
  titulo: string;
  completada: boolean;
  fechaVencimiento?: string;
  cliente?: { nombreCompleto: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ETAPA_COLORS: Record<string, string> = {
  Nuevo: "bg-slate-100 text-slate-700",
  Contactado: "bg-blue-100 text-blue-700",
  Cotizado: "bg-amber-100 text-amber-700",
  "Negociación": "bg-purple-100 text-purple-700",
  Ganado: "bg-green-100 text-green-700",
  Perdido: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  Alta: "bg-red-100 text-red-700",
  Media: "bg-amber-100 text-amber-700",
  Baja: "bg-green-100 text-green-700",
};

const ESTADO_PROYECTO_COLORS: Record<string, string> = {
  "Visita Técnica": "bg-purple-100 text-purple-700",
  Medición: "bg-indigo-100 text-indigo-700",
  Verificación: "bg-yellow-100 text-yellow-800",
  Taller: "bg-orange-100 text-orange-700",
  Depósito: "bg-slate-100 text-slate-700",
  Logística: "bg-blue-100 text-blue-700",
  Completado: "bg-green-100 text-green-700",
  Pausado: "bg-gray-100 text-gray-600",
  Rechazado: "bg-red-100 text-red-700",
};

function fmtDate(d?: string) {
  if (!d) return "—";
  return format(new Date(d), "d MMM yyyy", { locale: es });
}

function fmtDateTime(d?: string) {
  if (!d) return "—";
  return format(new Date(d), "d MMM yyyy 'a las' HH:mm", { locale: es });
}

function normalizePhone(raw?: string) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) return digits;
  const cleaned = digits.replace(/^0+/, "");
  return `54${cleaned}`;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditClientModal({ cliente, open, onOpenChange }: {
  cliente: ClientData;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...cliente });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const mut = useMutation({
    mutationFn: (body: Partial<ClientData>) => axios.put(`/api/clientes/${cliente._id}`, body),
    onSuccess: () => {
      toast.success("Cliente actualizado");
      qc.invalidateQueries({ queryKey: ["cliente", cliente._id] });
      onOpenChange(false);
    },
    onError: () => toast.error("Error al guardar"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="sm:col-span-2 font-semibold text-sm text-muted-foreground border-b pb-1">Datos personales</div>
          <div className="space-y-1"><Label>Nombre completo *</Label><Input value={form.nombreCompleto ?? ""} onChange={set("nombreCompleto")} /></div>
          <div className="space-y-1"><Label>Teléfono *</Label><Input value={form.telefono ?? ""} onChange={set("telefono")} /></div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={set("email")} /></div>
          <div className="space-y-1"><Label>DNI</Label><Input value={form.dni ?? ""} onChange={set("dni")} /></div>
          <div className="space-y-1"><Label>Dirección</Label><Input value={form.direccion ?? ""} onChange={set("direccion")} /></div>
          <div className="space-y-1"><Label>Ciudad</Label><Input value={form.ciudad ?? ""} onChange={set("ciudad")} /></div>
          <div className="space-y-1"><Label>País</Label><Input value={form.pais ?? ""} onChange={set("pais")} /></div>
          <div className="space-y-1">
            <Label>Prioridad</Label>
            <Select value={form.prioridad} onValueChange={(v) => setForm((f) => ({ ...f, prioridad: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Alta", "Media", "Baja"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Origen de contacto</Label><Input value={form.origenContacto ?? ""} onChange={set("origenContacto")} /></div>

          <div className="sm:col-span-2 font-semibold text-sm text-muted-foreground border-b pb-1 mt-2">Empresa</div>
          <div className="space-y-1"><Label>Empresa</Label><Input value={form.empresa ?? ""} onChange={set("empresa")} /></div>
          <div className="space-y-1"><Label>Razón Social</Label><Input value={form.razonSocial ?? ""} onChange={set("razonSocial")} /></div>
          <div className="space-y-1"><Label>CUIT</Label><Input value={form.cuil ?? ""} onChange={set("cuil")} /></div>
          <div className="space-y-1"><Label>Contacto empresa</Label><Input value={form.contactoEmpresa ?? ""} onChange={set("contactoEmpresa")} /></div>
          <div className="space-y-1"><Label>Dirección empresa</Label><Input value={form.direccionEmpresa ?? ""} onChange={set("direccionEmpresa")} /></div>
          <div className="space-y-1"><Label>Ciudad empresa</Label><Input value={form.ciudadEmpresa ?? ""} onChange={set("ciudadEmpresa")} /></div>
          <div className="space-y-1"><Label>País empresa</Label><Input value={form.paisEmpresa ?? ""} onChange={set("paisEmpresa")} /></div>

          <div className="sm:col-span-2 font-semibold text-sm text-muted-foreground border-b pb-1 mt-2">Notas internas</div>
          <div className="sm:col-span-2 space-y-1">
            <Label>Notas</Label>
            <Textarea rows={4} value={form.notas ?? ""} onChange={set("notas")} placeholder="Observaciones internas sobre el cliente..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          <Button onClick={() => mut.mutate(form)} disabled={mut.isPending}>
            {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClienteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const { formatMoney } = useCurrency();
  const [editOpen, setEditOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const { data: cliente, isLoading } = useQuery<ClientData>({
    queryKey: ["cliente", clientId],
    queryFn: async () => (await axios.get(`/api/clientes/${clientId}`)).data.data,
    enabled: !!clientId,
  });

  const { data: cotizaciones = [] } = useQuery<Cotizacion[]>({
    queryKey: ["cotizaciones-cliente", clientId],
    queryFn: async () => (await axios.get(`/api/clientes/${clientId}/cotizaciones`)).data.data,
    enabled: !!clientId,
  });

  const { data: proyectos = [] } = useQuery<Proyecto[]>({
    queryKey: ["proyectos-cliente", clientId],
    queryFn: async () => (await axios.get(`/api/proyectos?clienteId=${clientId}`)).data.data,
    enabled: !!clientId,
  });

  const { data: tareas = [] } = useQuery<Tarea[]>({
    queryKey: ["tareas-cliente", clientId],
    queryFn: async () => (await axios.get(`/api/clientes/${clientId}/tareas`)).data.data ?? [],
    enabled: !!clientId,
  });

  const { data: notas = [] } = useQuery<Nota[]>({
    queryKey: ["notas-cliente", clientId],
    queryFn: async () => (await axios.get(`/api/clientes/${clientId}/notas`)).data.data ?? [],
    enabled: !!clientId,
  });

  const { data: interacciones = [] } = useQuery<Interaccion[]>({
    queryKey: ["interacciones-cliente", clientId],
    queryFn: async () => (await axios.get(`/api/clientes/${clientId}/interacciones`)).data.data ?? [],
    enabled: !!clientId,
  });

  // Derived stats
  const totalCotizado = useMemo(() => cotizaciones.reduce((s, c) => s + (c.montoTotal ?? 0), 0), [cotizaciones]);
  const totalArchivos = useMemo(() => cotizaciones.reduce((s, c) => s + (c.archivos?.length ?? 0), 0), [cotizaciones]);
  const totalImagenes = useMemo(() => cotizaciones.reduce((s, c) => s + (c.imagenes?.length ?? 0), 0), [cotizaciones]);
  const todasImagenes = useMemo(() => cotizaciones.flatMap((c) => (c.imagenes ?? []).map((img) => ({ ...img, cotCodigo: c.codigo }))), [cotizaciones]);
  const todosArchivos = useMemo(() => cotizaciones.flatMap((c) => (c.archivos ?? []).map((a) => ({ ...a, cotCodigo: c.codigo, cotId: c._id }))), [cotizaciones]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cliente) {
    return <div className="p-10 text-center text-red-500">No se pudo encontrar el cliente.</div>;
  }

  const waPhone = normalizePhone(cliente.telefono);

  return (
    <div className="min-h-screen">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
            <div className="flex items-start gap-3">
              <button onClick={() => router.back()} className="mt-1 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{cliente.nombreCompleto}</h1>
                  <Badge className={ETAPA_COLORS[cliente.etapa] ?? "bg-gray-100 text-gray-700"}>
                    {cliente.etapa}
                  </Badge>
                  <Badge variant="outline" className={PRIORITY_COLORS[cliente.prioridad] ?? ""}>
                    {cliente.prioridad}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cliente desde {fmtDate(cliente.createdAt)}
                  {cliente.vendedorAsignado && ` · Asesor: ${cliente.vendedorAsignado.name}`}
                  {cliente.origenContacto && ` · Origen: ${cliente.origenContacto}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {cliente.telefono && (
                <a href={`tel:${cliente.telefono}`}>
                  <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-1" /> Llamar</Button>
                </a>
              )}
              {waPhone && (
                <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                    <FaWhatsapp className="h-4 w-4 mr-1" /> WhatsApp
                  </Button>
                </a>
              )}
              {cliente.email && (
                <a href={`mailto:${cliente.email}`}>
                  <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Email</Button>
                </a>
              )}
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Resumen KPIs ──────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: DollarSign, label: "Total Cotizado", value: formatMoney(totalCotizado), accent: true },
            { icon: FileText, label: "Cotizaciones", value: cotizaciones.length },
            { icon: Briefcase, label: "Proyectos", value: proyectos.length },
            { icon: Paperclip, label: "Archivos / Imágenes", value: `${totalArchivos} / ${totalImagenes}` },
          ].map(({ icon: Icon, label, value, accent }) => (
            <Card key={label} className="py-3">
              <CardContent className="px-4 py-0 flex items-center gap-3">
                <div className={`rounded-lg p-2 ${accent ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-lg font-bold ${accent ? "text-primary" : ""}`}>{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 mb-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="cotizaciones">
              Cotizaciones {cotizaciones.length > 0 && <span className="ml-1 text-xs opacity-70">({cotizaciones.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="proyectos">
              Proyectos {proyectos.length > 0 && <span className="ml-1 text-xs opacity-70">({proyectos.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="tareas">
              Tareas {tareas.length > 0 && <span className="ml-1 text-xs opacity-70">({tareas.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="notas">
              Notas &amp; Actividad
            </TabsTrigger>
            <TabsTrigger value="archivos">
              Archivos &amp; Fotos {(totalArchivos + totalImagenes) > 0 && <span className="ml-1 text-xs opacity-70">({totalArchivos + totalImagenes})</span>}
            </TabsTrigger>
          </TabsList>

          {/* ── TAB: Información ──────────────────────────────── */}
          <TabsContent value="info">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" /> Datos Personales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow icon={Phone} label="Teléfono" value={cliente.telefono} />
                  <InfoRow icon={Mail} label="Email" value={cliente.email} />
                  <InfoRow icon={Hash} label="DNI" value={cliente.dni} />
                  <InfoRow icon={MapPin} label="Dirección" value={[cliente.direccion, cliente.ciudad, cliente.pais].filter(Boolean).join(", ")} />
                  <InfoRow icon={Star} label="Prioridad" value={cliente.prioridad} />
                  <InfoRow icon={Globe} label="Origen" value={cliente.origenContacto} />
                  <InfoRow icon={Calendar} label="Alta" value={fmtDate(cliente.createdAt)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-4 w-4 text-primary" /> Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow icon={Building} label="Empresa" value={cliente.empresa} />
                  <InfoRow icon={FileText} label="Razón Social" value={cliente.razonSocial} />
                  <InfoRow icon={Hash} label="CUIT" value={cliente.cuil} />
                  <InfoRow icon={UserIcon} label="Contacto" value={cliente.contactoEmpresa} />
                  <InfoRow icon={MapPin} label="Dirección empresa" value={[cliente.direccionEmpresa, cliente.ciudadEmpresa, cliente.paisEmpresa].filter(Boolean).join(", ")} />
                  {cliente.empresaAsignada && (
                    <InfoRow icon={Building} label="Empresa asignada" value={cliente.empresaAsignada.razonSocial} />
                  )}
                </CardContent>
              </Card>

              {cliente.notas && (
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" /> Notas Internas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">{cliente.notas}</p>
                  </CardContent>
                </Card>
              )}

              {(cliente.etapa === "Perdido" && (cliente.motivoRechazo || cliente.detalleRechazo)) && (
                <Card className="md:col-span-2 border-destructive/30 bg-destructive/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Motivo de Rechazo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {cliente.motivoRechazo && <p><strong>Motivo:</strong> {cliente.motivoRechazo}</p>}
                    {cliente.detalleRechazo && <p className="text-muted-foreground">{cliente.detalleRechazo}</p>}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── TAB: Cotizaciones ─────────────────────────────── */}
          <TabsContent value="cotizaciones">
            <div className="space-y-3">
              {cotizaciones.length === 0 ? (
                <EmptyState icon={FileText} message="Sin cotizaciones" />
              ) : (
                <Accordion type="single" collapsible className="space-y-2">
                  {cotizaciones.map((cot) => (
                    <AccordionItem key={cot._id} value={cot._id} className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 w-full pr-4 flex-wrap">
                          <span className="font-bold text-base">{cot.codigo}</span>
                          {cot.nombre && cot.nombre !== cot.codigo && (
                            <span className="text-sm text-muted-foreground">{cot.nombre}</span>
                          )}
                          {cot.etapa && (
                            <Badge variant="outline" className="text-xs">{cot.etapa.nombre}</Badge>
                          )}
                          <span className="ml-auto font-bold text-primary">{formatMoney(cot.montoTotal)}</span>
                          <span className="text-xs text-muted-foreground">{fmtDate(cot.createdAt)}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
                          {cot.tipoObra && <InfoRow icon={Briefcase} label="Tipo de obra" value={cot.tipoObra} />}
                          {cot.tipoAbertura && <InfoRow icon={Hash} label="Tipo de abertura" value={cot.tipoAbertura} />}
                          {cot.comoNosConocio && <InfoRow icon={Globe} label="Cómo nos conoció" value={cot.comoNosConocio} />}
                          <InfoRow icon={DollarSign} label="Monto" value={formatMoney(cot.montoTotal)} />
                        </div>

                        {cot.pagos && cot.pagos.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Pagos ({cot.pagos.length})</p>
                            <div className="space-y-1">
                              {cot.pagos.map((p) => (
                                <div key={p.uid} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                                  <span>{p.metodo ?? "—"} · {p.fecha ? fmtDate(p.fecha) : "—"}</span>
                                  <span className="font-semibold">{formatMoney(p.monto)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cot.facturas && cot.facturas.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Facturas ({cot.facturas.length})</p>
                            <div className="space-y-1">
                              {cot.facturas.map((f) => (
                                <div key={f.uid} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                                  <span>Nº {f.numero ?? "—"}</span>
                                  <Badge variant="outline" className="text-[10px]">{f.estado ?? "—"}</Badge>
                                  <span className="font-semibold">{formatMoney(f.monto)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cot.archivos && cot.archivos.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Archivos ({cot.archivos.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {cot.archivos.map((a) => (
                                <a key={a.uid} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs bg-muted hover:bg-muted/80 rounded px-2 py-1">
                                  <Paperclip className="h-3 w-3" /> {a.name ?? "Archivo"}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {cot.imagenes && cot.imagenes.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Imágenes ({cot.imagenes.length})</p>
                            <div className="grid grid-cols-4 gap-2">
                              {cot.imagenes.map((img) => (
                                <button key={img.uid} onClick={() => setLightboxImg(img.url)} className="relative aspect-square rounded-md overflow-hidden border hover:opacity-90">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={img.url} alt={img.caption ?? "imagen"} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <Link href={`/dashboard/negocios`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Ver en Pipeline
                            </Button>
                          </Link>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>
          </TabsContent>

          {/* ── TAB: Proyectos ────────────────────────────────── */}
          <TabsContent value="proyectos">
            <div className="space-y-3">
              {proyectos.length === 0 ? (
                <EmptyState icon={Briefcase} message="Sin proyectos asociados" />
              ) : (
                proyectos.map((p) => (
                  <Card key={p._id} className="hover:bg-muted/30 transition-colors">
                    <CardContent className="px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-bold text-base">{p.numeroOrden}</span>
                        <Badge className={ESTADO_PROYECTO_COLORS[p.estadoActual ?? ""] ?? "bg-gray-100 text-gray-600"}>
                          {p.estadoActual ?? "Sin estado"}
                        </Badge>
                        {p.cotizacion && <span className="text-sm text-muted-foreground">Cot: {p.cotizacion.codigo}</span>}
                        {p.vendedor && <span className="text-sm text-muted-foreground">· {p.vendedor.name}</span>}
                        <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span>
                      </div>
                      <Link href={`/dashboard/proyectos/${p._id}`}>
                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── TAB: Tareas ───────────────────────────────────── */}
          <TabsContent value="tareas">
            <div className="space-y-3">
              <div className="flex justify-end">
                <AddTaskDialog />
              </div>
              {tareas.length === 0 ? (
                <EmptyState icon={CheckCircle2} message="Sin tareas pendientes" />
              ) : (
                <Card>
                  <CardContent className="p-4 space-y-2">
                    {tareas.map((t) => (
                      <TaskItem key={t._id} task={t as never} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── TAB: Notas & Actividad ────────────────────────── */}
          <TabsContent value="notas">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notas */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Notas ({notas.length})</h3>
                {notas.length === 0 ? (
                  <EmptyState icon={MessageSquare} message="Sin notas" />
                ) : (
                  <div className="space-y-3 border-l-2 border-border pl-5 relative">
                    {notas.map((n) => (
                      <div key={n._id} className="relative">
                        <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-primary" />
                        <p className="text-xs text-muted-foreground">{fmtDateTime(n.createdAt)} · {n.usuario?.name}</p>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{n.contenido}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interacciones */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Interacciones ({interacciones.length})</h3>
                {interacciones.length === 0 ? (
                  <EmptyState icon={Clock} message="Sin interacciones" />
                ) : (
                  <div className="space-y-3 border-l-2 border-border pl-5 relative">
                    {interacciones.map((i) => (
                      <div key={i._id} className="relative">
                        <div className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full bg-muted-foreground" />
                        <p className="text-xs font-medium">{i.tipo}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(i.createdAt)} · {i.usuario?.name}</p>
                        <p className="text-sm mt-1">{i.nota}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Separator />
                <AddInteractionForm clientId={clientId} />
              </div>
            </div>
          </TabsContent>

          {/* ── TAB: Archivos & Fotos ─────────────────────────── */}
          <TabsContent value="archivos">
            <div className="space-y-6">
              {/* Imágenes */}
              {todasImagenes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" /> Imágenes ({todasImagenes.length})
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {todasImagenes.map((img) => (
                      <button key={img.uid} onClick={() => setLightboxImg(img.url)} className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.caption ?? "imagen"} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] px-1 py-0.5 truncate">{img.cotCodigo}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Archivos */}
              {todosArchivos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-primary" /> Archivos ({todosArchivos.length})
                  </h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {todosArchivos.map((a) => (
                      <a key={a.uid} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="overflow-hidden">
                          <p className="truncate font-medium">{a.name ?? "Archivo"}</p>
                          <p className="text-xs text-muted-foreground">{a.cotCodigo}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 ml-auto text-muted-foreground flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {todasImagenes.length === 0 && todosArchivos.length === 0 && (
                <EmptyState icon={Paperclip} message="Sin archivos ni imágenes" />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Dialog ───────────────────────────────────────── */}
      {editOpen && (
        <EditClientModal cliente={cliente} open={editOpen} onOpenChange={setEditOpen} />
      )}

      {/* ── Image Lightbox ────────────────────────────────────── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImg} alt="Vista previa" className="max-w-full max-h-full rounded-lg" onClick={(e) => e.stopPropagation()} />
          <button className="absolute top-4 right-4 text-white hover:text-gray-300" onClick={() => setLightboxImg(null)}>
            <X className="h-8 w-8" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="font-medium">{String(value)}</span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
      <Icon className="h-10 w-10 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
