"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddClientDialog } from '@/components/clientes/AddClientDialog';
import { ClientActions } from '@/components/clientes/ClientActions';
import Link from 'next/link';

// Definimos la interfaz aquí para tener un tipado fuerte
interface Client {
  _id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  etapa: string;
  vendedorAsignado: string;
}

export default function ClientesPage() {
  const { data: clientes, isLoading, isError } = useQuery<Client[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await axios.get('/api/clientes');
      return data.data;
    },
  });

  if (isLoading) return <div className="p-10 text-center">Cargando clientes...</div>;
  if (isError) return <div className="p-10 text-center text-red-600">Error al cargar los clientes.</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Listado de Clientes</h1>
        <AddClientDialog />
      </div>

      <Table>
        <TableCaption>Una lista de tus clientes recientes.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientes?.map((cliente) => (
            <TableRow key={cliente._id}>
              <TableCell className="font-medium">
                <Link href={`/dashboard/clientes/${cliente._id}`} className="hover:underline">
                    {cliente.nombreCompleto}
                </Link>
              </TableCell>
              <TableCell>{cliente.etapa}</TableCell>
              <TableCell>{cliente.email}</TableCell>
              <TableCell>{cliente.telefono}</TableCell>
              <TableCell className="text-right">
                <ClientActions client={cliente} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}