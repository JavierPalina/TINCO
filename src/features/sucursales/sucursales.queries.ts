import axios from "axios";
import { useQuery } from "@tanstack/react-query";

export type Sucursal = { _id: string; nombre: string };

export function useSucursales() {
  return useQuery({
    queryKey: ["sucursales"],
    queryFn: async () => {
      const res = await axios.get("/api/sucursales");
      return res.data.data as Sucursal[];
    },
  });
}
