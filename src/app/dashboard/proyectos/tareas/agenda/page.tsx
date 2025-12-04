"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User as UserIcon,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";

import { IProyecto } from "@/models/Proyecto";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisitaTecnicaView } from "@/components/proyectos/VisitaTecnicaView";
import { MedicionView } from "@/components/proyectos/MedicionView";
import { VerificacionView } from "@/components/proyectos/VerificacionView";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Clave especial para "todos" en selects
const ALL_VALUE = "__all";

type AgendaStatusKey = "finalizado" | "iniciado" | "sin-iniciar";

type AgendaEvent = {
  dateKey: string;
  date: Date;
  horaVisita: string;
  proyecto: IProyecto;
  tecnicoNombre: string;
  clienteNombre: string;
  estadoTareaVisita?: string;
  statusKey: AgendaStatusKey;
  statusLabel: string;
  statusBgClass: string;
};

async function fetchProyectosVisitaTecnica(): Promise<IProyecto[]> {
  const { data } = await axios.get("/api/proyectos", {
    params: {
      // CSV de estados
      estados: "Visita Técnica,Medición,Verificación",
    },
  });
  return data.data;
}

const dateKeyFromDate = (d: Date) => d.toISOString().slice(0, 10);

function getAgendaStatus(vt: any): {
  key: AgendaStatusKey;
  label: string;
  bgClass: string;
} {
  const estado: string | undefined = vt?.estadoTareaVisita;

  if (!estado) {
    return {
      key: "sin-iniciar",
      label: "Sin iniciar",
      bgClass: "bg-red-500",
    };
  }

  if (estado === "Aprobado") {
    return {
      key: "finalizado",
      label: "Finalizado",
      bgClass: "bg-emerald-500",
    };
  }

  // Pendiente / Rechazado -> Iniciado
  return {
    key: "iniciado",
    label: "Iniciado",
    bgClass: "bg-amber-500",
  };
}

function buildMonthMatrix(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Semana que empieza en lunes
  const jsDay = firstOfMonth.getDay(); // 0=domingo
  const firstWeekday = (jsDay + 6) % 7; // 0=lun,...,6=dom

  const totalCells = firstWeekday + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);

  const matrix: (Date | null)[][] = [];
  let currentDay = 1;

  for (let w = 0; w < weeks; w++) {
    const row: (Date | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const cellIndex = w * 7 + d;
      if (cellIndex < firstWeekday || currentDay > daysInMonth) {
        row.push(null);
      } else {
        row.push(new Date(year, month, currentDay));
        currentDay++;
      }
    }
    matrix.push(row);
  }

  return matrix;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export default function AgendaVisitaTecnicaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [proyectoSeleccionado, setProyectoSeleccionado] =
    useState<IProyecto | null>(null);

  // qué etapa se ve en el modal del proyecto
  const [viewStage, setViewStage] = useState<
    "visitaTecnica" | "medicion" | "verificacion" | null
  >(null);

  // día seleccionado para "Ver más..."
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Filtros / búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] =
    useState<AgendaStatusKey | typeof ALL_VALUE>(ALL_VALUE);
  const [tecnicoFilter, setTecnicoFilter] = useState<string | typeof ALL_VALUE>(
    ALL_VALUE,
  );
  const [clienteObraFilter, setClienteObraFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: proyectos, isLoading, isError } = useQuery({
    queryKey: ["proyectos-visita-tecnica"],
    queryFn: fetchProyectosVisitaTecnica,
  });

  // Mes actual (centrado en hoy)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // 1) Armamos todos los eventos planos
  const allEvents = useMemo<AgendaEvent[]>(() => {
    const list: AgendaEvent[] = [];
    if (!proyectos) return list;

    for (const proyecto of proyectos) {
      const vt: any = (proyecto as any).visitaTecnica;
      if (!vt) continue;

      const tieneTecnico = Boolean(
        vt.asignadoA?.name ||
          typeof vt.asignadoA === "string" ||
          vt.asignadoA?._id,
      );
      if (!tieneTecnico || !vt.fechaVisita || !vt.horaVisita) continue;

      const fecha = new Date(vt.fechaVisita);
      if (Number.isNaN(fecha.getTime())) continue;

      const dateKey = dateKeyFromDate(fecha);

      const tecnicoNombre =
        vt.asignadoA?.name ||
        (typeof vt.asignadoA === "string" && vt.asignadoA) ||
        "Sin asignar";

      const cliente: any = (proyecto as any).cliente || {};
      const clienteNombre = cliente?.nombreCompleto || "Sin nombre";

      const status = getAgendaStatus(vt);

      list.push({
        dateKey,
        date: fecha,
        horaVisita: vt.horaVisita,
        proyecto,
        tecnicoNombre,
        clienteNombre,
        estadoTareaVisita: vt.estadoTareaVisita,
        statusKey: status.key,
        statusLabel: status.label,
        statusBgClass: status.bgClass,
      });
    }

    return list;
  }, [proyectos]);

  // Opciones únicas de técnico para el select
  const tecnicosOptions = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((ev) => {
      if (ev.tecnicoNombre) set.add(ev.tecnicoNombre);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [allEvents]);

  // 2) Aplicamos filtros / búsqueda
  const filteredEvents = useMemo(() => {
    if (!allEvents.length) return [];

    const q = searchTerm.trim().toLowerCase();
    const clienteObra = clienteObraFilter.trim().toLowerCase();

    const from = dateRange?.from ? startOfDay(dateRange.from) : null;
    const to = dateRange?.to ? endOfDay(dateRange.to) : null;

    return allEvents.filter((ev) => {
      const proyecto: any = ev.proyecto;
      const vt: any = (proyecto as any).visitaTecnica || {};
      const cliente: any = proyecto.cliente || {};
      const vendedor: any = proyecto.vendedor || {};

      // Filtro por estado (Finalizado / Iniciado / Sin iniciar)
      if (estadoFilter !== ALL_VALUE && ev.statusKey !== estadoFilter) {
        return false;
      }

      // Filtro por técnico
      if (tecnicoFilter !== ALL_VALUE && ev.tecnicoNombre !== tecnicoFilter) {
        return false;
      }

      // Filtro por rango de fechas
      if (from && ev.date < from) return false;
      if (to && ev.date > to) return false;

      // Filtro "Cliente u Obra"
      if (clienteObra) {
        const textoClienteObra = [
          cliente?.nombreCompleto,
          cliente?.direccion,
          vt?.direccion,
          vt?.entrecalles,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!textoClienteObra.includes(clienteObra)) {
          return false;
        }
      }

      // Buscador global
      if (q) {
        const textoGlobal = [
          ev.clienteNombre,
          cliente?.telefono,
          cliente?.direccion,
          proyecto.numeroOrden,
          proyecto.estadoActual,
          vendedor?.name,
          vt?.tipoVisita,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!textoGlobal.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    allEvents,
    estadoFilter,
    tecnicoFilter,
    dateRange,
    clienteObraFilter,
    searchTerm,
  ]);

  // 3) Agrupamos por día
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, AgendaEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!grouped[ev.dateKey]) grouped[ev.dateKey] = [];
      grouped[ev.dateKey].push(ev);
    });

    // Ordenamos por hora dentro de cada día
    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => a.horaVisita.localeCompare(b.horaVisita)),
    );

    return grouped;
  }, [filteredEvents]);

  // Eventos del día seleccionado (para "Ver más...")
  const selectedDayEvents = useMemo(
    () =>
      selectedDayKey ? eventsByDate[selectedDayKey] || [] : [],
    [selectedDayKey, eventsByDate],
  );

  const monthMatrix = useMemo(
    () => buildMonthMatrix(currentMonth),
    [currentMonth],
  );

  const monthLabel = currentMonth.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    });
  };

  const goToToday = () => {
    const t = new Date();
    setCurrentMonth(new Date(t.getFullYear(), t.getMonth(), 1));
  };

  const clearFilters = () => {
    setEstadoFilter(ALL_VALUE);
    setTecnicoFilter(ALL_VALUE);
    setClienteObraFilter("");
    setDateRange(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 text-red-500">
        Error al cargar la agenda de visitas técnicas.
      </div>
    );
  }

  const noEvents = Object.keys(eventsByDate).length === 0;

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-7 w-7 text-primary" />
            Calendario de Mis Tareas
          </h1>
          <p className="text-muted-foreground text-sm">
            Vista mensual con todas las tareas que tienen técnico, fecha y hora
            asignadas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/proyectos/tareas")}
          >
            Volver a la tabla
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: ["proyectos-visita-tecnica"],
              });
              toast.info("Agenda actualizada");
            }}
          >
            <Loader2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Buscador + filtros avanzados */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Buscador global */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, número de orden, estado, vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtros avanzados en popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros avanzados
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[380px] sm:w-[540px]" align="end">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">Filtros de agenda</p>
                <p className="text-xs text-muted-foreground">
                  Filtrá las visitas por estado, técnico, cliente/obra y fechas.
                </p>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-primary hover:underline"
              >
                Limpiar
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Estado */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Estado</p>
                <Select
                  value={estadoFilter}
                  onValueChange={(val) =>
                    setEstadoFilter(val as AgendaStatusKey | typeof ALL_VALUE)
                  }
                >
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="iniciado">Iniciado</SelectItem>
                    <SelectItem value="sin-iniciar">Sin iniciar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Técnico */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Técnico</p>
                <Select
                  value={tecnicoFilter}
                  onValueChange={(val) => setTecnicoFilter(val)}
                >
                  <SelectTrigger className="h-8 text-xs w-full">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                    {tecnicosOptions.map((tec) => (
                      <SelectItem key={tec} value={tec}>
                        {tec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cliente / Obra */}
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Cliente u Obra</p>
                <Input
                  placeholder="Nombre del cliente, dirección de obra..."
                  value={clienteObraFilter}
                  onChange={(e) => setClienteObraFilter(e.target.value)}
                  className="h-8 text-xs w-full"
                />
              </div>

              {/* Rango de fechas */}
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Rango de fechas</p>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-between text-left font-normal h-8 w-full",
                          !dateRange && "text-muted-foreground",
                        )}
                      >
                        <span className="flex-1 truncate">
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {dateRange.from.toLocaleDateString("es-AR")} –{" "}
                                {dateRange.to.toLocaleDateString("es-AR")}
                              </>
                            ) : (
                              dateRange.from.toLocaleDateString("es-AR")
                            )
                          ) : (
                            "Seleccionar rango"
                          )}
                        </span>
                        <CalendarDays className="ml-2 h-3 w-3 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={1}   // un solo mes
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {dateRange && (
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:underline whitespace-nowrap"
                      onClick={() => setDateRange(undefined)}
                    >
                      Limpiar rango
                    </button>
                  )}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Controles de mes */}
      <div className="flex items-center justify-between rounded-xl border bg-card/70 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-lg font-semibold capitalize">{monthLabel}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Finalizado
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Iniciado
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Sin iniciar
          </span>

          <span className="mx-2 h-4 w-px bg-border" />
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={goToToday}
          >
            Hoy
          </Button>
        </div>
      </div>

      {noEvents ? (
        <div className="border rounded-xl p-10 text-center text-muted-foreground bg-muted/40">
          No hay visitas técnicas que coincidan con los filtros actuales.
          <br />
          <span className="text-xs">
            Completá técnico, fecha y hora en la etapa de Visita Técnica para
            que aparezcan en el calendario.
          </span>
        </div>
      ) : (
        <div className="rounded-xl border bg-card/70 shadow-sm overflow-hidden">
          {/* Cabecera de días */}
          <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="px-3 py-2 text-center">
                {d}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7 text-xs">
            {monthMatrix.map((week, wIdx) =>
              week.map((date, dIdx) => {
                if (!date) {
                  return (
                    <div
                      key={`empty-${wIdx}-${dIdx}`}
                      className="border-b border-r min-h-[110px] bg-background/40"
                    />
                  );
                }

                const key = dateKeyFromDate(date);
                const events = eventsByDate[key] || [];

                const isToday = (() => {
                  const t = new Date();
                  return (
                    t.getFullYear() === date.getFullYear() &&
                    t.getMonth() === date.getMonth() &&
                    t.getDate() === date.getDate()
                  );
                })();

                return (
                  <div
                    key={key}
                    className="border-b border-r min-h-[140px] relative bg-background/60 hover:bg-accent/40 transition-colors"
                  >
                    {/* número de día */}
                    <div className="flex items-center justify-between px-2 pt-1 pb-1">
                      <span
                        className={`ml-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ${
                          isToday
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : ""
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    {/* eventos del día */}
                    {events.length > 0 && (() => {
                      const MAX_EVENTS = 5;
                      const visibleEvents = events.slice(0, MAX_EVENTS);
                      const hasMore = events.length > MAX_EVENTS;

                      return (
                        <div className="px-1 pb-1 flex flex-col gap-1.5 max-h-[110px] overflow-y-auto">
                          {visibleEvents.map((ev) => (
                            <button
                              key={`${ev.proyecto._id}-${ev.horaVisita}`}
                              type="button"
                              onClick={() => {
                                setProyectoSeleccionado(ev.proyecto);
                                if (ev.proyecto.estadoActual === "Medición") {
                                  setViewStage("medicion");
                                } else if (
                                  ev.proyecto.estadoActual === "Verificación"
                                ) {
                                  setViewStage("verificacion");
                                } else {
                                  setViewStage("visitaTecnica");
                                }
                              }}
                              className={cn(
                                "w-full rounded-md px-2 py-1 text-left text-[11px] text-white shadow-sm flex flex-col gap-0.5 hover:brightness-110 transition",
                                ev.statusBgClass,
                              )}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 font-semibold">
                                  <Clock className="h-3 w-3" />
                                  {ev.horaVisita}
                                </span>
                                <span className="truncate font-medium">
                                  {ev.clienteNombre}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1 opacity-90">
                                <span className="inline-flex items-center gap-1 truncate">
                                  <UserIcon className="h-3 w-3" />
                                  {ev.tecnicoNombre}
                                </span>
                                {ev.statusLabel && (
                                  <span className="text-[10px] font-medium">
                                    {ev.statusLabel}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}

                          {hasMore && (
                            <button
                              type="button"
                              onClick={() => setSelectedDayKey(key)}
                              className="mt-1 text-[10px] font-medium text-primary underline-offset-2 hover:underline text-left px-1"
                            >
                              Ver más...
                            </button>
                          )}
                        </div>
                      );
                    })()}

                    {events.length === 0 && (
                      <div className="px-2 pb-3 text-[10px] text-muted-foreground/60">
                        {/* Día vacío */}
                      </div>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      )}

      {/* Modal detalle proyecto (Visita / Medición / Verificación) */}
      <Dialog
        open={!!proyectoSeleccionado}
        onOpenChange={(open) => {
          if (!open) {
            setProyectoSeleccionado(null);
            setViewStage(null);
          }
        }}
      >
        {proyectoSeleccionado && (
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {proyectoSeleccionado.numeroOrden} –{" "}
                {viewStage === "medicion"
                  ? "Medición"
                  : viewStage === "verificacion"
                  ? "Verificación"
                  : "Visita Técnica"}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4">
              {viewStage === "medicion" ? (
                <MedicionView
                  proyecto={proyectoSeleccionado}
                  onDeleted={() => {
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                    queryClient.invalidateQueries({
                      queryKey: ["proyectos-visita-tecnica"],
                    });
                  }}
                />
              ) : viewStage === "verificacion" ? (
                <VerificacionView
                  proyecto={proyectoSeleccionado}
                  onDeleted={() => {
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                    queryClient.invalidateQueries({
                      queryKey: ["proyectos-visita-tecnica"],
                    });
                  }}
                />
              ) : (
                <VisitaTecnicaView
                  proyecto={proyectoSeleccionado}
                  onDeleted={() => {
                    setProyectoSeleccionado(null);
                    setViewStage(null);
                    queryClient.invalidateQueries({
                      queryKey: ["proyectos-visita-tecnica"],
                    });
                  }}
                />
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Modal de día completo (Ver más...) */}
      <Dialog
        open={!!selectedDayKey}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDayKey(null);
          }
        }}
      >
        {selectedDayKey && (
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {(() => {
                  const d = new Date(selectedDayKey);
                  return d.toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                })()}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay tareas para este día.
                </p>
              ) : (
                selectedDayEvents.map((ev) => (
                  <button
                    key={`${ev.proyecto._id}-${ev.horaVisita}-daymodal`}
                    type="button"
                    onClick={() => {
                      setSelectedDayKey(null);
                      setProyectoSeleccionado(ev.proyecto);
                      if (ev.proyecto.estadoActual === "Medición") {
                        setViewStage("medicion");
                      } else if (ev.proyecto.estadoActual === "Verificación") {
                        setViewStage("verificacion");
                      } else {
                        setViewStage("visitaTecnica");
                      }
                    }}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-xs text-white shadow-sm flex flex-col gap-1 hover:brightness-110 transition",
                      ev.statusBgClass,
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Clock className="h-3 w-3" />
                        {ev.horaVisita}
                      </span>
                      <span className="truncate font-medium">
                        {ev.clienteNombre}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 opacity-90">
                      <span className="inline-flex items-center gap-1 truncate">
                        <UserIcon className="h-3 w-3" />
                        {ev.tecnicoNombre}
                      </span>
                      {ev.statusLabel && (
                        <span className="text-[10px] font-medium">
                          {ev.statusLabel}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
