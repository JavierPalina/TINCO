"use client";

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Upload } from 'lucide-react';

// --- Definimos un tipo tipado para los clientes importados ---
type ImportedClient = {
  nombreCompleto?: string;
  telefono?: string;
  email?: string;
  empresa?: string;
  prioridad?: string;
  [key: string]: string | undefined; // permite acceder a cualquier columna del CSV
};

export function ImportClientsDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (clientes: ImportedClient[]) => axios.post('/api/clientes/import', { clientes }),
    onSuccess: (response) => {
      toast.success("Importación completada", { description: response.data.message });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      setOpen(false);
      setFile(null);
    },
    onError: (error: unknown) => {
      const msg = axios.isAxiosError(error) ? error.response?.data?.error : "No se pudieron importar los clientes.";
      toast.error("Error en la importación", { description: msg });
    }
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setFile(event.target.files[0]);
  };

  const handleImport = () => {
    if (!file) {
      toast.warning("Por favor, selecciona un archivo CSV.");
      return;
    }

    Papa.parse<ImportedClient>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mappedData: ImportedClient[] = results.data.map((row) => ({
          nombreCompleto: row["Nombre Completo"] || row["nombreCompleto"],
          telefono: row["Teléfono"] || row["telefono"],
          email: row["Email"] || row["email"],
          empresa: row["Empresa"] || row["empresa"],
          prioridad: row["Prioridad"] || row["prioridad"],
        }));
        mutation.mutate(mappedData);
      },
      error: () => {
        toast.error("Error al procesar el archivo CSV.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Importar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Clientes desde CSV</DialogTitle>
          <DialogDescription>
            Selecciona un archivo CSV. Asegúrate de que las columnas coincidan: `Nombre Completo`, `Teléfono`, `Email`, `Empresa`, `Prioridad`.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          {file && <p className="text-sm text-muted-foreground">Archivo seleccionado: {file.name}</p>}
        </div>
        <Button onClick={handleImport} disabled={mutation.isPending}>
          {mutation.isPending ? "Importando..." : "Iniciar Importación"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
