"use client";

import { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
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

interface IPersonalData {
  cuil?: string;
  fechaNacimiento?: string;
  nacionalidad?: string;
  estadoCivil?: "soltero" | "casado" | "divorciado" | "viudo";
  direccion?: {
    calle?: string;
    numero?: string;
    piso?: string;
    depto?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
  };
}

interface IContactData {
  telefonoPrincipal?: string;
  telefonoSecundario?: string;
  emailPersonal?: string;
  contactoEmergencia?: {
    nombre?: string;
    parentesco?: string;
    telefono?: string;
  };
}

interface ILaboralData {
  puesto?: string;
  fechaIngreso?: string;
  equipo?: string;
  reportaA?: string;
}

interface IFinancieraLegalData {
  cbu?: string;
  banco?: string;
  obraSocial?: string;
  numeroAfiliado?: string;
}

interface IUserFormData {
  name: string;
  email: string;
  rol: UserRole;
  password?: string;

  personalData?: IPersonalData;
  contactData?: IContactData;
  laboralData?: ILaboralData;
  financieraLegalData?: IFinancieraLegalData;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user?: IUser2;
}

export function UserFormDialog({ isOpen, onOpenChange, user }: UserFormDialogProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue } = useForm<IUserFormData>();

  const formatDateForInput = (date?: string | Date) => {
    if (!date) return "";
    try {
      return new Date(date).toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        rol: user.rol,
        password: "",
        personalData: {
          ...(user.personalData as any),
          fechaNacimiento: formatDateForInput((user.personalData as any)?.fechaNacimiento),
        },
        contactData: (user.contactData as any) || {},
        laboralData: {
          ...(user.laboralData as any),
          fechaIngreso: formatDateForInput((user.laboralData as any)?.fechaIngreso),
        },
        financieraLegalData: (user.financieraLegalData as any) || {},
      });
      setValue("rol", user.rol);
    } else {
      reset({
        name: "",
        email: "",
        rol: "vendedor",
        password: "",
        personalData: {},
        contactData: {},
        laboralData: {},
        financieraLegalData: {},
      });
    }
  }, [user, reset, setValue]);

  const createMutation = useMutation<unknown, AxiosError, IUserFormData>({
    mutationFn: (data) => axios.post("/api/create-user", data),
    onSuccess: () => {
      toast.success("Usuario creado con éxito!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error) => {
      const errorMessage =
        (error?.response?.data as { error?: string })?.error || "Error al crear el usuario.";
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation<unknown, AxiosError, IUserFormData>({
    mutationFn: (data) => axios.put(`/api/users/${user!._id}`, data),
    onSuccess: () => {
      toast.success("Usuario actualizado con éxito!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
    onError: (error) => {
      const errorMessage =
        (error?.response?.data as { error?: string })?.error || "Error al actualizar el usuario.";
      toast.error(errorMessage);
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
                  onValueChange={(value) => setValue("rol", value as UserRole)}
                  defaultValue={(user?.rol ?? "vendedor") as UserRole}
                >
                  <SelectTrigger>
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
                      <SelectTrigger>
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
