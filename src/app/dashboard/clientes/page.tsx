"use client";

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
import { WhatsAppButton } from '@/components/clientes/WhatsAppButton';
import { EmailButton } from '@/components/clientes/EmailButton';
import { CSVLink } from "react-csv";
import { Download, Import } from "lucide-react";
import { ImportClientsDialog } from '@/components/clientes/ImportClientsDialog';
import { useDebounce } from 'use-debounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ClientFilters } from '@/components/clientes/ClientFilters';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClientMobileCard } from '@/components/clientes/ClientMobileCard';

type ColumnVisibility = {
    'Nombre Completo': boolean;
    'Teléfono': boolean;
    'Email': boolean;
    'Dirección': boolean;
    'Ciudad': boolean;
    'País': boolean;
    'DNI': boolean;
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
    'DNI': false,
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
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [isClient, setIsClient] = useState(false);
  const [filters, setFilters] = useState({ searchTerm: '', etapa: '', prioridad: '' });
  const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

  const { data: prioridadesUnicas } = useQuery<string[]>({
    queryKey: ['prioridades'],
    queryFn: async () => {
      const { data } = await axios.get('/api/clientes/prioridades');
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const queryKey = ['clientes', debouncedSearchTerm, filters.etapa, filters.prioridad];
  
  const { data: clientes, isLoading, isError, isFetching } = useQuery<Client[]>({
    queryKey: queryKey,
    queryFn: async () => {
      const { data } = await axios.get('/api/clientes', {
        params: { 
            searchTerm: debouncedSearchTerm, 
            etapa: filters.etapa, 
            prioridad: filters.prioridad 
        }
      });
      return data.data;
    },
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    setIsClient(true);
    const savedVisibility = localStorage.getItem('clientColumnVisibility');
    if (savedVisibility) {
      const savedParsed = JSON.parse(savedVisibility);
      setColumnVisibility(prev => ({ ...DEFAULT_VISIBILITY, ...savedParsed }));
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('clientColumnVisibility', JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, isClient]);

  if (isLoading) return <div className="p-10 text-center">Cargando clientes...</div>;
  if (isError) return <div className="p-10 text-center text-red-600">Error al cargar los clientes.</div>;

  const csvHeaders = [
    { label: "Nombre Completo", key: "nombreCompleto" },
    { label: "Teléfono", key: "telefono" },
    { label: "Email", key: "email" },
    { label: "Empresa", key: "empresa" },
    { label: "Prioridad", key: "prioridad" },
    { label: "Etapa", key: "etapa" },
    { label: "Origen", key: "origenContacto" },
  ];

  const csvData = clientes || [];

  const handleFilterChange = (name: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <div className="mx-auto py-4 px-4 md:px-4">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 border-b mb-4">
        <h1 className="text-3xl font-bold">Listado de Clientes</h1>
        <div className="flex items-center gap-2 flex-wrap pb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline">Ver Columnas</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mostrar/Ocultar Columnas</DropdownMenuLabel>
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
            {isClient && (<Button variant="outline" asChild>
              <CSVLink 
                data={csvData} 
                headers={csvHeaders}
                filename={"clientes_crm.csv"}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </CSVLink>
            </Button>)}
            <ImportClientsDialog />
            <AddClientDialog prioridadesOptions={prioridadesUnicas || []} />
        </div>
      </div>

      <ClientFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        prioridadesUnicas={prioridadesUnicas || []}
      />

      <div className={cn(
        "border rounded-md transition-opacity duration-300 hidden md:block border rounded-md mt-4",
        isFetching ? "opacity-50" : "opacity-100"
      )}>
        <Table>
          <TableHeader>
            <TableRow>
              {columnVisibility['Nombre Completo'] && <TableHead className="text-center">Nombre Completo</TableHead>}
              {columnVisibility['Teléfono'] && <TableHead className="text-center">Teléfono</TableHead>}
              {columnVisibility['Email'] && <TableHead className="text-center">Email</TableHead>}
              {columnVisibility['DNI'] && <TableHead className="text-center">DNI</TableHead>}
              {columnVisibility['Dirección'] && <TableHead className="text-center">Dirección</TableHead>}
              {columnVisibility['Ciudad'] && <TableHead className="text-center">Ciudad</TableHead>}
              {columnVisibility['País'] && <TableHead className="text-center">País</TableHead>}
              {columnVisibility['Prioridad'] && <TableHead className="text-center">Prioridad</TableHead>}
              {columnVisibility['Etapa'] && <TableHead className="text-center">Etapa</TableHead>}
              {columnVisibility['Origen de Contacto'] && <TableHead className="text-center">Origen</TableHead>}
              {columnVisibility['Empresa'] && <TableHead className="text-center">Empresa</TableHead>}
              {columnVisibility['Último Contacto'] && <TableHead className="text-center">Último Contacto</TableHead>}
              {columnVisibility['Fecha de Creación'] && <TableHead className="text-center">Fecha de Creación</TableHead>}
              {columnVisibility['Notas'] && <TableHead className="text-center">Notas</TableHead>}
              {columnVisibility['Interacciones'] && <TableHead className="text-center">Interacciones</TableHead>}
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes?.map((cliente) => (
              <TableRow key={cliente._id}>
                {columnVisibility['Nombre Completo'] && <TableCell className="font-medium text-center"><Link href={`/dashboard/clientes/${cliente._id}`} className="hover:underline">{cliente.nombreCompleto}</Link></TableCell>}
                {columnVisibility['Teléfono'] && 
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2 group">
                      <span>{cliente.telefono}</span>
                      <div className="group-hover:opacity-100 transition-opacity">
                        <WhatsAppButton telefono={cliente.telefono} />
                      </div>
                    </div>
                  </TableCell>
                }                
                {columnVisibility['Email'] && 
                  <TableCell className="text-center">
                    {cliente.email ? (
                      <div className="flex items-center justify-center gap-2 group">
                        <span>{cliente.email}</span>
                        <div className="group-hover:opacity-100 transition-opacity">
                          <EmailButton email={cliente.email} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                }
                {columnVisibility['DNI'] && <TableCell className="text-center">{cliente.dni || '-'}</TableCell>}
                {columnVisibility['Dirección'] && <TableCell className="text-center">{cliente.direccion || '-'}</TableCell>}
                {columnVisibility['Ciudad'] && <TableCell className="text-center">{cliente.ciudad || '-'}</TableCell>}
                {columnVisibility['País'] && <TableCell className="text-center">{cliente.pais || '-'}</TableCell>}
                {columnVisibility['Prioridad'] && <TableCell className="text-center">{cliente.prioridad || '-'}</TableCell>}
                {columnVisibility['Etapa'] && <TableCell className="text-center">{cliente.etapa || '-'}</TableCell>}
                {columnVisibility['Origen de Contacto'] && <TableCell className="text-center">{cliente.origenContacto || '-'}</TableCell>}
                {columnVisibility['Empresa'] && <TableCell><div className="flex items-center text-center justify-center">{cliente.empresa || 'Sin Asignar'}<CompanyDataPopover client={cliente} /></div></TableCell>}
                {columnVisibility['Último Contacto'] && <TableCell className="text-center">{cliente.ultimoContacto ? format(new Date(cliente.ultimoContacto), 'dd MMM yyyy', { locale: es }) : 'Sin Contactar'}</TableCell>}
                {columnVisibility['Fecha de Creación'] && <TableCell className="text-center">{format(new Date(cliente.createdAt), 'dd MMM yyyy', { locale: es })}</TableCell>}
                {columnVisibility['Notas'] && <TableCell className="text-center"><TableCellActions client={cliente} actionType="notas" /></TableCell>}
                {columnVisibility['Interacciones'] && <TableCell className="text-center"><TableCellActions client={cliente} actionType="interacciones" /></TableCell>}
                <TableCell className="text-center"><ClientActions client={cliente} prioridadesOptions={prioridadesUnicas || []} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden mt-4">
        {isLoading && <div className="text-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
        {clientes?.map((cliente) => (
            <ClientMobileCard key={cliente._id} client={cliente} prioridadesOptions={[]} />
        ))}
        {!isLoading && clientes?.length === 0 && (
            <div className="text-center text-muted-foreground py-10">No se encontraron clientes.</div>
        )}
      </div>
    </div>
  );
}