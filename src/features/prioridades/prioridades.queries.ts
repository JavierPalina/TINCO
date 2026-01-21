import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Prioridad = { _id: string; nombre: string; activa: boolean };

export function usePrioridades() {
  return useQuery({
    queryKey: ["prioridades"],
    queryFn: async () => {
      const res = await axios.get("/api/prioridades");
      return res.data.data as Prioridad[];
    },
  });
}

export function useCreatePrioridad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      const res = await axios.post("/api/prioridades", { nombre });
      return res.data.data as Prioridad;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prioridades"] });
    },
  });
}
