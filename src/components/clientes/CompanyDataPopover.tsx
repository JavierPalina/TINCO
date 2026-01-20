"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Building2 } from "lucide-react";
import { Client } from "@/types/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useSearchParams } from "next/navigation";

type EmpresaLite = {
  _id: string;
  razonSocial: string;
  nombreFantasia?: string;
  cuit?: string;
};

type FormInputs = {
  empresaAsignada: string; // "" => none
};

type ClientWithEmpresa = Client & {
  empresaAsignada?: string | null;
};

export function CompanyDataPopover({ client }: { client: ClientWithEmpresa }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // ✅ comportamiento #2: respetar sucursal seleccionada en filtros (URL)
  const searchParams = useSearchParams();
  const sucursalId = (searchParams.get("sucursalId") || "").trim();

  const { data: empresasLite, isLoading } = useQuery<EmpresaLite[]>({
    // ✅ incluir sucursalId para cache correcto
    queryKey: ["empresas-lite", search, sucursalId],
    queryFn: async () => {
      const { data } = await axios.get("/api/empresas/simple", {
        params: {
          q: search,
          // ✅ backend debe aceptar sucursalId (y validarlo por rol)
          ...(sucursalId ? { sucursalId } : {}),
        },
      });
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const options = useMemo(() => {
    return [
      { value: "", label: "Sin empresa" },
      ...(empresasLite || []).map((e) => ({
        value: e._id,
        label: `${e.razonSocial}${e.cuit ? ` — ${e.cuit}` : ""}`,
      })),
    ];
  }, [empresasLite]);

  const currentEmpresaId = client.empresaAsignada ?? "";

  const { handleSubmit, setValue, watch } = useForm<FormInputs>({
    defaultValues: { empresaAsignada: currentEmpresaId },
  });

  const empresaAsignada = watch("empresaAsignada") || "";

  useEffect(() => {
    // si cambia el cliente, actualizo valor
    setValue("empresaAsignada", currentEmpresaId);
  }, [currentEmpresaId, setValue]);

  const selectedEmpresa = useMemo(() => {
    if (!empresaAsignada) return null;
    return (empresasLite || []).find((e) => e._id === empresaAsignada) || null;
  }, [empresaAsignada, empresasLite]);

  const mutation = useMutation({
    mutationFn: async (payload: FormInputs) => {
      return axios.put(`/api/clientes/${client._id}`, {
        empresaAsignada: payload.empresaAsignada || null,
      });
    },
    onSuccess: async () => {
      toast.success("Empresa actualizada");
      await Promise.all([
        // ✅ invalidar en modo no-exacto para cubrir filtros/sucursal
        queryClient.invalidateQueries({ queryKey: ["clientes"], exact: false }),
        queryClient.invalidateQueries({ queryKey: ["cliente", client._id], exact: false }),
      ]);
    },
    onError: () => {
      toast.error("Error al actualizar", {
        description: "No se pudieron guardar los cambios.",
      });
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => mutation.mutate(data);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="h-7 w-7 bg-primary/10 hover:bg-primary/40 text-primary"
          style={{ marginLeft: "4px" }}
          title="Cambiar empresa"
        >
          <Building2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[420px]">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Empresa del cliente</h4>
            <p className="text-sm text-muted-foreground">
              Se asigna una única empresa existente. Los datos provienen del módulo Empresas.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Buscar empresa</Label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Razón social, nombre fantasía o CUIT..."
            />
          </div>

          <div className="grid gap-2">
            <Label>Empresa asignada</Label>
            <Combobox
              options={options}
              value={empresaAsignada}
              onChange={(v) => setValue("empresaAsignada", v)}
              placeholder={isLoading ? "Cargando..." : "Seleccionar empresa..."}
            />
          </div>

          <div className="grid gap-2 rounded-md border p-3">
            <div className="text-sm font-medium">Detalle (solo lectura)</div>
            {selectedEmpresa ? (
              <div className="grid gap-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Razón social: </span>
                  <span>{selectedEmpresa.razonSocial}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Nombre fantasía: </span>
                  <span>{selectedEmpresa.nombreFantasia || "-"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">CUIT: </span>
                  <span>{selectedEmpresa.cuit || "-"}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Sin empresa seleccionada.</div>
            )}
          </div>

          <Button type="submit" size="sm" disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
