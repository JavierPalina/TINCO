"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { CSVLink } from "react-csv";
import { MoreHorizontal, Pencil, Trash2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { EditEmpresaDialog } from "./EditEmpresaDialog";

type Empresa = {
  _id: string;
  cuit?: string;
  razonSocial?: string;
  nombreFantasia?: string;
  telefono?: string;
  email?: string;
  localidad?: string;
  provincia?: string;
  categoriaIVA?: string;
  inscriptoGanancias?: boolean;
};

const csvHeaders = [
  { label: "CUIT", key: "cuit" },
  { label: "Razón Social", key: "razonSocial" },
  { label: "Nombre Fantasía", key: "nombreFantasia" },
  { label: "Teléfono", key: "telefono" },
  { label: "Email", key: "email" },
  { label: "Localidad", key: "localidad" },
  { label: "Provincia", key: "provincia" },
  { label: "Categoría IVA", key: "categoriaIVA" },
  { label: "Inscripto Ganancias", key: "inscriptoGanancias" },
];

const safeStr = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s.length ? s : "-";
};

export function EmpresaActions({ empresa }: { empresa: Empresa }) {
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/empresas/${id}`),
    onSuccess: () => {
      toast.success("Empresa eliminada con éxito");
      queryClient.invalidateQueries({ queryKey: ["empresas"], exact: false });
    },
    onError: () => {
      toast.error("Error al eliminar la empresa.");
    },
  });

  const handleDelete = () => deleteMutation.mutate(empresa._id);

  return (
    <>
      <EditEmpresaDialog
        empresa={empresa}
        isOpen={isEditDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="center">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>

          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar Empresa
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <CSVLink
              data={[empresa]}
              headers={csvHeaders}
              filename={`empresa_${safeStr(empresa?.razonSocial).replace(/\s+/g, "_")}.csv`}
              className="flex items-center w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar CSV
            </CSVLink>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Empresa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
