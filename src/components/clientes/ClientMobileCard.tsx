"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Client } from "@/types/client";
import { ClientActions } from "./ClientActions";
import Link from 'next/link';

interface Props {
  client: Client;
  prioridadesOptions: string[];
}

export function ClientMobileCard({ client, prioridadesOptions }: Props) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              <Link href={`/dashboard/clientes/${client._id}`} className="hover:underline">
                {client.nombreCompleto}
              </Link>
            </CardTitle>
            <CardDescription>{client.empresa || 'Sin empresa'}</CardDescription>
          </div>
          <ClientActions client={client} prioridadesOptions={prioridadesOptions} />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold">Etapa</p>
          <p className="text-muted-foreground">{client.etapa}</p>
        </div>
        <div>
          <p className="font-semibold">Prioridad</p>
          <p className="text-muted-foreground">{client.prioridad}</p>
        </div>
        <div>
          <p className="font-semibold">Teléfono</p>
          <p className="text-muted-foreground">{client.telefono}</p>
        </div>
        <div>
          <p className="font-semibold">Origen</p>
          <p className="text-muted-foreground">{client.origenContacto || '-'}</p>
        </div>
      </CardContent>
    </Card>
  );
}