"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { AddClientDialog } from '@/components/clientes/AddClientDialog';
import { ClientActions } from '@/components/clientes/ClientActions';
import { CompanyDataPopover } from '@/components/clientes/CompanyDataPopover';
import { TableCellActions } from '@/components/clientes/TableCellActions';
import { Client } from '@/types/client';

type ColumnVisibility = {
    'Nombre Completo': boolean;
    'Teléfono': boolean;
    'Email': boolean;
    'Dirección': boolean;
    'Ciudad': boolean;
    'País': boolean;
    'Prioridad': boolean;
    'Etapa': boolean;
    'Origen de Contacto': boolean;
    'Empresa': boolean;
    'Último Contacto': boolean;
    'Fecha de Creación': boolean;
    'Notas': boolean;
    'Interacciones': boolean;
};

const DEFAULT_VISIBILITY: ColumnVisibility = {
    'Nombre Completo': true,
    'Teléfono': true,
    'Email': false,
    'Dirección': false,
    'Ciudad': false,
    'País': false,
    'Prioridad': true,
    'Etapa': true,
    'Origen de Contacto': true,
    'Empresa': true,
    'Último Contacto': true,
    'Fecha de Creación': false,
    'Notas': true,
    'Interacciones': true,
};
const orderedColumns = Object.keys(DEFAULT_VISIBILITY) as (keyof ColumnVisibility)[];

export default function ClientesPage() {
  const { data: clientes, isLoading, isError } = useQuery<Client[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data } = await axios.get('/api/clientes');
      return data.data;
    },
  });

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBILITY;
    const saved = localStorage.getItem('clientColumnVisibility');
    const savedParsed = saved ? JSON.parse(saved) : {};
    return { ...DEFAULT_VISIBILITY, ...savedParsed };
  });

  useEffect(() => {
    localStorage.setItem('clientColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  if (isLoading) return <div className="p-10 text-center">Cargando clientes...</div>;
  if (isError) return <div className="p-10 text-center text-red-600">Error al cargar los clientes.</div>;

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Listado de Clientes</h1>
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline">Ver Columnas</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Mostrar/Ocircultar Columnas</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {orderedColumns.map((column) => (
                        <DropdownMenuCheckboxItem
                            key={column}
                            checked={columnVisibility[column]}
                            onCheckedChange={() => toggleColumn(column)}
                            onSelect={(e) => e.preventDefault()}
                        >{column}</DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <AddClientDialog />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility['Nombre Completo'] && <TableHead>Nombre Completo</TableHead>}
              {columnVisibility['Teléfono'] && <TableHead>Teléfono</TableHead>}
              {columnVisibility['Email'] && <TableHead>Email</TableHead>}
              {columnVisibility['Dirección'] && <TableHead>Dirección</TableHead>}
              {columnVisibility['Ciudad'] && <TableHead>Ciudad</TableHead>}
              {columnVisibility['País'] && <TableHead>País</TableHead>}
              {columnVisibility['Prioridad'] && <TableHead>Prioridad</TableHead>}
              {columnVisibility['Etapa'] && <TableHead>Etapa</TableHead>}
              {columnVisibility['Origen de Contacto'] && <TableHead>Origen</TableHead>}
              {columnVisibility['Empresa'] && <TableHead>Empresa</TableHead>}
              {columnVisibility['Último Contacto'] && <TableHead>Último Contacto</TableHead>}
              {columnVisibility['Fecha de Creación'] && <TableHead>Fecha de Creación</TableHead>}
              {columnVisibility['Notas'] && <TableHead className="text-center">Notas</TableHead>}
              {columnVisibility['Interacciones'] && <TableHead className="text-center">Interacciones</TableHead>}
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes?.map((cliente) => (
              <TableRow key={cliente._id}>
                {columnVisibility['Nombre Completo'] && <TableCell className="font-medium"><Link href={`/dashboard/clientes/${cliente._id}`} className="hover:underline">{cliente.nombreCompleto}</Link></TableCell>}
                {columnVisibility['Teléfono'] && <TableCell>{cliente.telefono}</TableCell>}
                {columnVisibility['Email'] && <TableCell>{cliente.email}</TableCell>}
                {columnVisibility['Dirección'] && <TableCell>{cliente.direccion}</TableCell>}
                {columnVisibility['Ciudad'] && <TableCell>{cliente.ciudad}</TableCell>}
                {columnVisibility['País'] && <TableCell>{cliente.pais}</TableCell>}
                {columnVisibility['Prioridad'] && <TableCell>{cliente.prioridad}</TableCell>}
                {columnVisibility['Etapa'] && <TableCell>{cliente.etapa}</TableCell>}
                {columnVisibility['Origen de Contacto'] && <TableCell>{cliente.origenContacto}</TableCell>}
                {columnVisibility['Empresa'] && <TableCell><div className="flex items-center">{cliente.empresa}<CompanyDataPopover client={cliente} /></div></TableCell>}
                {columnVisibility['Último Contacto'] && <TableCell>{cliente.ultimoContacto ? format(new Date(cliente.ultimoContacto), 'dd MMM yyyy', { locale: es }) : 'N/A'}</TableCell>}
                {columnVisibility['Fecha de Creación'] && <TableCell>{format(new Date(cliente.createdAt), 'dd MMM yyyy', { locale: es })}</TableCell>}
                {columnVisibility['Notas'] && <TableCell><TableCellActions client={cliente} actionType="notas" /></TableCell>}
                {columnVisibility['Interacciones'] && <TableCell><TableCellActions client={cliente} actionType="interacciones" /></TableCell>}
                <TableCell className="text-right"><ClientActions client={cliente} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}