"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { IUser2 } from "@/app/dashboard/users/page";
import type { UserRole } from "@/lib/roles";
import type {
  IPersonalData,
  IContactData,
  ILaboralData,
  IFinancieraLegalData,
} from "@/models/User";

/**
 * Tipos de formulario:
 * - Conservan estructura del modelo
 * - Transforman fechas a string "yyyy-mm-dd" para inputs type="date"
 */
type PersonalDataForm = Omit<IPersonalData, "fechaNacimiento"> & {
  fechaNacimiento?: string;
};

type LaboralDataForm = Omit<ILaboralData, "fechaIngreso"> & {
  fechaIngreso?: string;
};

type SucursalLite = { _id: string; nombre: string };
type SucursalApiRow = { _id: string; nombre: string; direccion: string };

interface IUserFormData {
  name: string;
  email: string;
  rol: UserRole;
  password?: string;

  // ✅ NUEVO: para asignación desde dialog
  // "none" => sin asignar
  sucursalId?: string;

  personalData?: PersonalDataForm;
  contactData?: IContactData;
  laboralData?: LaboralDataForm;
  financieraLegalData?: IFinancieraLegalData;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IUser2;
}

function formatDateForInput(date?: string | Date | null): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined;
    return data?.error || data?.message || err.message || "Error";
  }
  if (err instanceof Error) return err.message;
  return "Error";
}

export function UserFormDialog({ isOpen, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue, watch } = useForm<IUserFormData>({
    defaultValues: {
      name: "",
      email: "",
      rol: "vendedor",
      password: "",
      sucursalId: "none",
      personalData: {},
      contactData: {},
      laboralData: {},
      financieraLegalData: {},
    },
  });

  // ✅ Traer sucursales para el select
  const { data: sucursales, isLoading: loadingSucursales } = useQuery<SucursalApiRow[]>({
    queryKey: ["sucursales-lite"],
    queryFn: async () => {
      const { data } = await axios.get<{ ok: boolean; data: SucursalApiRow[] }>("/api/sucursales");
      return data.data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: isOpen,
  });

  // Mantener Select controlado (para que se refleje al reset)
  const sucursalIdValue = watch("sucursalId") || "none";

  useEffect(() => {
    if (user) {
      const personalData: PersonalDataForm = {
        ...(user.personalData ?? {}),
        fechaNacimiento: formatDateForInput(user.personalData?.fechaNacimiento),
      };

      const laboralData: LaboralDataForm = {
        ...(user.laboralData ?? {}),
        fechaIngreso: formatDateForInput(user.laboralData?.fechaIngreso),
      };

      const currentSucursalId =
        (user.sucursal && typeof user.sucursal === "object"
          ? (user.sucursal as SucursalLite)._id
          : null) || null;

      reset({
        name: user.name,
        email: user.email,
        rol: user.rol,
        password: "",
        sucursalId: currentSucursalId ?? "none",
        personalData,
        contactData: user.contactData ?? {},
        laboralData,
        financieraLegalData: user.financieraLegalData ?? {},
      });

      setValue("rol", user.rol);
    } else {
      reset({
        name: "",
        email: "",
        rol: "vendedor",
        password: "",
        sucursalId: "none",
        personalData: {},
        contactData: {},
        laboralData: {},
        financieraLegalData: {},
      });
    }
  }, [user, reset, setValue]);

  const createMutation = useMutation<unknown, unknown, IUserFormData>({
    mutationFn: (data) => {
      // ✅ Normalizar sucursalId para backend: string | null
      const payload = {
        ...data,
        sucursalId: data.sucursalId && data.sucursalId !== "none" ? data.sucursalId : null,
      };
      return axios.post("/api/create-user", payload);
    },
    onSuccess: () => {
      toast.success("Usuario creado con éxito!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Error al crear el usuario.");
    },
  });

  const updateMutation = useMutation<unknown, unknown, IUserFormData>({
    mutationFn: (data) => {
      // ✅ Normalizar sucursalId para backend: string | null
      const payload = {
        ...data,
        sucursalId: data.sucursalId && data.sucursalId !== "none" ? data.sucursalId : null,
      };
      return axios.put(`/api/users/${user!._id}`, payload);
    },
    onSuccess: () => {
      toast.success("Usuario actualizado con éxito!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || "Error al actualizar el usuario.");
    },
  });

  const onSubmit: SubmitHandler<IUserFormData> = (data) => {
    if (user) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Empleado" : "Agregar Nuevo Empleado"}</DialogTitle>
          <DialogDescription>
            Completa los datos del empleado. Los campos de acceso son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Datos de Acceso</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo*</Label>
                <Input id="name" {...register("name", { required: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de la Empresa*</Label>
                <Input id="email" type="email" {...register("email", { required: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rol">Rol*</Label>
                <Select
                  value={watch("rol")}
                  onValueChange={(value) => setValue("rol", value as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="post_venta">Post Venta</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="tecnico_taller">Técnico de Taller</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                    <SelectItem value="logistica">Logística</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ NUEVO: Sucursal */}
              <div className="space-y-2">
                <Label>Sucursal</Label>

                <Select
                  value={sucursalIdValue}
                  onValueChange={(value) => setValue("sucursalId", value)}
                  disabled={loadingSucursales}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {(sucursales || []).map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {loadingSucursales ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cargando sucursales...
                  </div>
                ) : null}
              </div>

              {!user && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña*</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", { required: !user })}
                  />
                </div>
              )}
            </div>
          </div>

          <Accordion type="multiple" className="w-full mt-4">
            <AccordionItem value="personal">
              <AccordionTrigger>Información Personal</AccordionTrigger>
              <AccordionContent className="p-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>CUIL</Label>
                    <Input {...register("personalData.cuil")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Nacimiento</Label>
                    <Input type="date" {...register("personalData.fechaNacimiento")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Nacionalidad</Label>
                    <Input {...register("personalData.nacionalidad")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Estado Civil</Label>
                    <Select
                      onValueChange={(v) =>
                        setValue("personalData.estadoCivil", v as IPersonalData["estadoCivil"])
                      }
                      defaultValue={user?.personalData?.estadoCivil}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soltero">Soltero/a</SelectItem>
                        <SelectItem value="casado">Casado/a</SelectItem>
                        <SelectItem value="divorciado">Divorciado/a</SelectItem>
                        <SelectItem value="viudo">Viudo/a</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <h5 className="text-sm font-semibold">Dirección</h5>

                  <div className="space-y-2">
                    <Label>Calle</Label>
                    <Input {...register("personalData.direccion.calle")} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Número</Label>
                      <Input {...register("personalData.direccion.numero")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Piso/Depto</Label>
                      <Input {...register("personalData.direccion.depto")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Input {...register("personalData.direccion.ciudad")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Código Postal</Label>
                      <Input {...register("personalData.direccion.codigoPostal")} />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="laboral-contacto">
              <AccordionTrigger>Información Laboral y de Contacto</AccordionTrigger>
              <AccordionContent className="p-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Puesto / Cargo</Label>
                    <Input {...register("laboralData.puesto")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de Ingreso</Label>
                    <Input type="date" {...register("laboralData.fechaIngreso")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Equipo / Sector</Label>
                    <Input {...register("laboralData.equipo")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono Principal</Label>
                    <Input {...register("contactData.telefonoPrincipal")} />
                  </div>

                  <div className="space-y-2 col-span-full">
                    <Label>Email Personal</Label>
                    <Input type="email" {...register("contactData.emailPersonal")} />
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-4">
                  <h5 className="text-sm font-semibold">Contacto de Emergencia</h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre Completo</Label>
                      <Input {...register("contactData.contactoEmergencia.nombre")} />
                    </div>

                    <div className="space-y-2">
                      <Label>Parentesco</Label>
                      <Input {...register("contactData.contactoEmergencia.parentesco")} />
                    </div>

                    <div className="space-y-2 col-span-full">
                      <Label>Teléfono de Emergencia</Label>
                      <Input {...register("contactData.contactoEmergencia.telefono")} />
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="financiera-legal">
              <AccordionTrigger>Información Financiera y Legal</AccordionTrigger>
              <AccordionContent className="p-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input {...register("financieraLegalData.banco")} />
                  </div>

                  <div className="space-y-2">
                    <Label>CBU / Alias</Label>
                    <Input {...register("financieraLegalData.cbu")} />
                  </div>

                  <div className="space-y-2">
                    <Label>Obra Social</Label>
                    <Input {...register("financieraLegalData.obraSocial")} />
                  </div>

                  <div className="space-y-2">
                    <Label>N° de Afiliado</Label>
                    <Input {...register("financieraLegalData.numeroAfiliado")} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                </>
              ) : user ? (
                "Guardar Cambios"
              ) : (
                "Crear Empleado"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
