// src/lib/roles.ts
export const ROLES = [
  "vendedor",
  "admin",
  "gerente",
  "tecnico",
  "tecnico_taller",
  "administrativo",
  "deposito",
  "logistica",
  "post_venta",
] as const;

export type UserRole = (typeof ROLES)[number];

export type AppSection =
  | "pipeline"
  | "clientes"
  | "proyectos"
  | "servicios"
  | "stock"
  | "control_stock"   // <- nueva
  | "notificaciones"
  | "users"
  | "configuracion"
  | "perfil";

export type ProyectoStageKey =
  | "visita_tecnica"
  | "medicion"
  | "verificacion"
  | "taller"
  | "deposito"
  | "logistica"
  | "todos"
  | "tareas"; // agenda/tabla

const ALL_SECTIONS: AppSection[] = [
  "pipeline",
  "clientes",
  "proyectos",
  "servicios",
  "stock",
  "control_stock",
  "notificaciones",
  "users",
  "configuracion",
  "perfil",
];

const BASE_ALWAYS: AppSection[] = ["perfil", "configuracion", "notificaciones"];

const ROLE_SECTION_ACCESS: Partial<Record<UserRole, AppSection[]>> = {
  vendedor: ["pipeline", "clientes", ...BASE_ALWAYS],
  post_venta: ["pipeline", "clientes", ...BASE_ALWAYS],

  tecnico: ["proyectos", ...BASE_ALWAYS],
  tecnico_taller: ["proyectos", ...BASE_ALWAYS],
  logistica: ["proyectos", ...BASE_ALWAYS],

  // Depósito: proyectos + stock (y si sumás "control_stock" como sección nueva, agregala acá)
  deposito: ["proyectos", "stock", ...BASE_ALWAYS],

  administrativo: ["pipeline", "clientes", "proyectos", ...BASE_ALWAYS],

  gerente: ALL_SECTIONS,
  admin: ALL_SECTIONS,
};

/**
 * Si el rol NO está en el mapa, por tu regla => full access.
 */
export function canAccessSection(role: string | undefined | null, section: AppSection): boolean {
  if (!role) return false;

  const r = role as UserRole;
  const allowed = ROLE_SECTION_ACCESS[r];

  if (!allowed) return true; // 👈 "otros roles" => full access
  return allowed.includes(section);
}

/**
 * Extra: qué etapas del dropdown "Proyectos" puede ver cada rol.
 * (Si no está en el mapa => full access)
 */
const ROLE_PROYECTOS_ACCESS: Partial<Record<UserRole, ProyectoStageKey[]>> = {
  tecnico: ["visita_tecnica", "medicion", "verificacion", "tareas"],
  tecnico_taller: ["taller", "tareas"],
  deposito: ["deposito", "tareas"],
  logistica: ["logistica", "tareas"],

  // administrativo: todo proyectos + tareas + tablero general
  administrativo: [
    "todos",
    "tareas",
    "visita_tecnica",
    "medicion",
    "verificacion",
    "taller",
    "deposito",
    "logistica",
  ],

  // vendedor / post_venta no deberían entrar a proyectos por secciones
  vendedor: [],
  post_venta: [],
};

export function canAccessProyectoStage(
  role: string | undefined | null,
  stage: ProyectoStageKey
): boolean {
  if (!role) return false;

  const r = role as UserRole;
  const allowed = ROLE_PROYECTOS_ACCESS[r];

  if (!allowed) return true; // otros roles => full access
  return allowed.includes(stage);
}
