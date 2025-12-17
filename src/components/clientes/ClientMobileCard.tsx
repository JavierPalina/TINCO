"use client";

import Link from "next/link";
import { Building2, Flag, Phone, Layers } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Client } from "@/types/client";
import { ClientActions } from "./ClientActions";

interface Props {
  client: Client;
  prioridadesOptions: string[];
}

const toTitle = (value?: string | null) => {
  const s = String(value ?? "").trim();
  if (!s) return "-";
  return s
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const initials = (name?: string | null) => {
  const s = String(name ?? "").trim();
  if (!s) return "?";
  const parts = s.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
};

const digitsOnly = (phone?: string | null) => String(phone ?? "").replace(/[^\d+]/g, "");

export function ClientMobileCard({ client, prioridadesOptions }: Props) {
  const phone = digitsOnly(client.telefono);

  return (
    <Card className="mb-4 overflow-hidden border-l-4 border-l-primary shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
              {initials(client.nombreCompleto)}
            </div>

            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">
                <Link
                  href={`/dashboard/clientes/${client._id}`}
                  className="hover:underline truncate block"
                >
                  {toTitle(client.nombreCompleto)}
                </Link>
              </CardTitle>

              <CardDescription className="truncate">
                {client.empresa ? toTitle(client.empresa) : "Sin empresa"}
              </CardDescription>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                  {toTitle(client.etapa) || "Nuevo"}
                </span>

                <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                  {toTitle(client.prioridad) || "Media"}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 pt-1">
            <ClientActions client={client} prioridadesOptions={prioridadesOptions} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Layers className="h-4 w-4" />
              Etapa
            </div>
            <div className="mt-1 font-semibold text-foreground">
              {toTitle(client.etapa) || "Nuevo"}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Flag className="h-4 w-4" />
              Prioridad
            </div>
            <div className="mt-1 font-semibold text-foreground">
              {toTitle(client.prioridad) || "Media"}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Phone className="h-4 w-4" />
              Teléfono
            </div>

            {phone ? (
              <a
                href={`tel:${phone}`}
                className="mt-1 inline-block font-semibold text-primary hover:underline"
              >
                {client.telefono}
              </a>
            ) : (
              <div className="mt-1 font-semibold text-foreground">-</div>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Origen
            </div>
            <div className="mt-1 font-semibold text-foreground">
              {toTitle(client.origenContacto) || "-"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
