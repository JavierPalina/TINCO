// src/app/dashboard/configuracion/accesos/page.tsx
"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ROLES, type UserRole } from "@/lib/roles";

type SectionKey =
  | "negocios"
  | "proyectos"
  | "clientes"
  | "servicios"
  | "stock"
  | "users"
  | "notificaciones";

type ProyectoStageKey = "tareas";

type RoleAccessDoc = {
  _id: string;
  role: UserRole;
  sections: Record<SectionKey, boolean>;
  proyectoStages: Record<ProyectoStageKey, boolean>;
};

type RoleAccessResponse = { ok: boolean; data: RoleAccessDoc[] };

const SECTION_LABELS: Record<SectionKey, string> = {
  negocios: "Negocios",
  proyectos: "Proyectos",
  clientes: "Listados / Clientes",
  servicios: "Servicios",
  stock: "Stock",
  users: "Usuarios",
  notificaciones: "Notificaciones",
};

const STAGE_LABELS: Record<ProyectoStageKey, string> = {
  tareas: "Proyectos: Tareas (Agenda/Tabla)",
};

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || err.message || "Error";
  }
  if (err instanceof Error) return err.message;
  return "Error";
}

function buildEmptyConfig(role: UserRole): Omit<RoleAccessDoc, "_id"> {
  return {
    role,
    sections: {
      negocios: false,
      proyectos: false,
      clientes: false,
      servicios: false,
      stock: false,
      users: false,
      notificaciones: false,
    },
    proyectoStages: {
      tareas: false,
    },
  };
}

export default function AccesosPorRolesPage() {
  const qc = useQueryClient();

  const [selectedRole, setSelectedRole] = useState<UserRole>("vendedor");

  const { data, isLoading, isFetching } = useQuery<RoleAccessDoc[]>({
    queryKey: ["role-access"],
    queryFn: async () => {
      const res = await axios.get<RoleAccessResponse>("/api/role-access");
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  // Mapa por rol (si no existe en DB, mostramos default vacío para editar igual)
  const configByRole = useMemo(() => {
    const map = new Map<UserRole, RoleAccessDoc | Omit<RoleAccessDoc, "_id">>();
    for (const r of ROLES as readonly UserRole[]) map.set(r, buildEmptyConfig(r));
    for (const doc of data || []) map.set(doc.role, doc);
    return map;
  }, [data]);

  const selectedConfig = configByRole.get(selectedRole) ?? buildEmptyConfig(selectedRole);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      role: UserRole;
      sections: Record<SectionKey, boolean>;
      proyectoStages: Record<ProyectoStageKey, boolean>;
    }) => {
      const res = await axios.put(`/api/role-access/${payload.role}`, {
        sections: payload.sections,
        proyectoStages: payload.proyectoStages,
      });
      return res.data as { ok: boolean };
    },
    onSuccess: () => {
      toast.success("Permisos guardados.");
      qc.invalidateQueries({ queryKey: ["role-access"] });
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err));
    },
  });

  const [draft, setDraft] = useState<{
    role: UserRole;
    sections: Record<SectionKey, boolean>;
    proyectoStages: Record<ProyectoStageKey, boolean>;
  }>(() => ({
    role: selectedRole,
    sections: buildEmptyConfig(selectedRole).sections,
    proyectoStages: buildEmptyConfig(selectedRole).proyectoStages,
  }));

  // Sincronizar draft al cambiar de rol / data
  useMemo(() => {
    const cfg = configByRole.get(selectedRole) ?? buildEmptyConfig(selectedRole);
    setDraft({
      role: selectedRole,
      sections: { ...cfg.sections },
      proyectoStages: { ...cfg.proyectoStages },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole, (data || []).length]);

  const setSection = (key: SectionKey, value: boolean) => {
    setDraft((p) => ({ ...p, sections: { ...p.sections, [key]: value } }));
  };

  const setStage = (key: ProyectoStageKey, value: boolean) => {
    setDraft((p) => ({ ...p, proyectoStages: { ...p.proyectoStages, [key]: value } }));
  };

  const handleSave = () => {
    saveMutation.mutate(draft);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto py-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Accesos por Roles</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configurá qué secciones ve cada rol. Se aplica en el Header y navegación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFetching ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Actualizando...
            </div>
          ) : null}

          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </div>

      {/* Selector de rol */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(ROLES as readonly UserRole[]).map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
              selectedRole === r
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Secciones del sistema</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Rol: {selectedRole}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            {(Object.keys(SECTION_LABELS) as SectionKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{SECTION_LABELS[key]}</div>
                  <div className="text-xs text-muted-foreground">
                    {draft.sections[key] ? "Habilitado" : "Deshabilitado"}
                  </div>
                </div>
                <Switch checked={Boolean(draft.sections[key])} onCheckedChange={(v) => setSection(key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Permisos específicos</CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Proyectos
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            {(Object.keys(STAGE_LABELS) as ProyectoStageKey[]).map((key) => (
              <div key={key} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{STAGE_LABELS[key]}</div>
                  <div className="text-xs text-muted-foreground">
                    {draft.proyectoStages[key] ? "Habilitado" : "Deshabilitado"}
                  </div>
                </div>
                <Switch checked={Boolean(draft.proyectoStages[key])} onCheckedChange={(v) => setStage(key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
