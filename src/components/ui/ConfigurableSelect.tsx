"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigOpcion {
  _id: string;
  tipo: string;
  valor: string;
}

interface Props {
  tipo: string; // 'color', 'perfilAluminio', 'perfilPvc', etc.
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// 1. Hook para obtener los datos
function useConfigOpciones(tipo: string) {
  return useQuery<ConfigOpcion[]>({
    queryKey: ['configOpcion', tipo],
    queryFn: async () => {
      const { data } = await axios.get(`/api/configuracion/${tipo}`);
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
}

export function ConfigurableSelect({ tipo, value, onChange, disabled }: Props) {
  const queryClient = useQueryClient();
  const { data: opciones, isLoading } = useConfigOpciones(tipo);
  const [nuevoValor, setNuevoValor] = useState("");
  const [showInput, setShowInput] = useState(false);

  // 2. Mutación para crear nueva opción
  const mutation = useMutation({
    mutationFn: (valor: string) => 
      axios.post(`/api/configuracion/${tipo}`, { valor }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configOpcion', tipo] });
      setNuevoValor("");
      setShowInput(false);
      onChange(data.data.valor); // Auto-seleccionar el nuevo valor
      toast.success("Opción agregada");
    },
    onError: () => {
      toast.error("Error al agregar la opción");
    }
  });

  const handleAddNew = () => {
    if (!nuevoValor.trim()) return;
    mutation.mutate(nuevoValor.trim());
  };

  return (
    <div className="space-y-2">
      <Select onValueChange={onChange} value={value || ''} disabled={disabled || isLoading}>
        <SelectTrigger>
          <SelectValue placeholder={isLoading ? "Cargando..." : `Seleccionar ${tipo}...`} />
        </SelectTrigger>
        <SelectContent>
          {opciones?.map((opcion) => (
            <SelectItem key={opcion._id} value={opcion.valor}>
              {opcion.valor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {!disabled && (
        <>
          {!showInput && (
            <Button variant="outline" size="sm" onClick={() => setShowInput(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Agregar nuevo
            </Button>
          )}
          
          {showInput && (
            <div className="flex gap-2">
              <Input 
                value={nuevoValor} 
                onChange={(e) => setNuevoValor(e.target.value)}
                placeholder="Nombre de la nueva opción"
              />
              <Button onClick={handleAddNew} disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowInput(false)}>
                <span className="text-xs">X</span>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}