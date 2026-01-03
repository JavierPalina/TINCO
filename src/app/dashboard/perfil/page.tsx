"use client";

import Image from "next/image";
import axios from "axios";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AvatarUploader } from "./AvatarUploader";
import { perfilSchema, type PerfilFormValues } from "./schema";

type MeData = {
  _id: string;
  name: string | null;
  email: string | null;
  rol: string;
  image: string | null;
  personalData: any;
  contactData: any;
  laboralData: any;
  financieraLegalData: any;
};

async function fetchMe(): Promise<MeData> {
  const { data } = await axios.get("/api/users/me");
  return data.data as MeData;
}

function isoDateOrEmpty(value: any): string {
  // Soporta Date de Mongo o string; devolvemos yyyy-mm-dd o ""
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function PerfilPage() {
  const { data: session, update } = useSession();
  const qc = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 60_000,
  });

  const form = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      image: null,
      personalData: {
        cuil: null,
        fechaNacimiento: null,
        nacionalidad: null,
        estadoCivil: null,
        direccion: {
          calle: null,
          numero: null,
          piso: null,
          depto: null,
          ciudad: null,
          provincia: null,
          codigoPostal: null,
        },
      },
      contactData: {
        telefonoPrincipal: null,
        telefonoSecundario: null,
        emailPersonal: null,
        contactoEmergencia: {
          nombre: null,
          parentesco: null,
          telefono: null,
        },
      },
      laboralData: {
        puesto: null,
        fechaIngreso: null,
        equipo: null,
        reportaA: null,
      },
      financieraLegalData: {
        cbu: null,
        banco: null,
        obraSocial: null,
        numeroAfiliado: null,
      },
    },
  });

  useEffect(() => {
    if (!me) return;

    form.reset({
      name: me.name ?? "",
      image: me.image ?? null,
      personalData: {
        cuil: me.personalData?.cuil ?? null,
        fechaNacimiento: isoDateOrEmpty(me.personalData?.fechaNacimiento) || null,
        nacionalidad: me.personalData?.nacionalidad ?? null,
        estadoCivil: me.personalData?.estadoCivil ?? null,
        direccion: {
          calle: me.personalData?.direccion?.calle ?? null,
          numero: me.personalData?.direccion?.numero ?? null,
          piso: me.personalData?.direccion?.piso ?? null,
          depto: me.personalData?.direccion?.depto ?? null,
          ciudad: me.personalData?.direccion?.ciudad ?? null,
          provincia: me.personalData?.direccion?.provincia ?? null,
          codigoPostal: me.personalData?.direccion?.codigoPostal ?? null,
        },
      },
      contactData: {
        telefonoPrincipal: me.contactData?.telefonoPrincipal ?? null,
        telefonoSecundario: me.contactData?.telefonoSecundario ?? null,
        emailPersonal: me.contactData?.emailPersonal ?? null,
        contactoEmergencia: {
          nombre: me.contactData?.contactoEmergencia?.nombre ?? null,
          parentesco: me.contactData?.contactoEmergencia?.parentesco ?? null,
          telefono: me.contactData?.contactoEmergencia?.telefono ?? null,
        },
      },
      laboralData: {
        puesto: me.laboralData?.puesto ?? null,
        fechaIngreso: isoDateOrEmpty(me.laboralData?.fechaIngreso) || null,
        equipo: me.laboralData?.equipo ?? null,
        reportaA: me.laboralData?.reportaA ?? null,
      },
      financieraLegalData: {
        cbu: me.financieraLegalData?.cbu ?? null,
        banco: me.financieraLegalData?.banco ?? null,
        obraSocial: me.financieraLegalData?.obraSocial ?? null,
        numeroAfiliado: me.financieraLegalData?.numeroAfiliado ?? null,
      },
    });
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const avatarSrc =
    form.watch("image") || session?.user?.image || "/avatar-placeholder.png";

  const saveMutation = useMutation({
    mutationFn: async (values: PerfilFormValues) => {
      const { data } = await axios.put("/api/users/me", values);
      return data;
    },
    onSuccess: async () => {
      toast.success("Perfil actualizado");
      await qc.invalidateQueries({ queryKey: ["me"] });

      const values = form.getValues();
      await update({ name: values.name ?? null, image: values.image ?? null } as any);

      // marcar “sin cambios”
      form.reset(values);
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : "Error";
      toast.error("No se pudo guardar: " + msg);
    },
  });

  if (isLoading || !me) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const isBusy = saveMutation.isPending;

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Perfil</h1>
          <p className="text-muted-foreground">Editá tus datos y tu foto de perfil.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="relative h-24 w-24 rounded-full overflow-hidden border">
                <Image src={avatarSrc} alt="Avatar" fill className="object-cover" />
              </div>

              <div className="flex-1">
                <div className="space-y-1">
                  <p className="font-semibold">{me.name || "Usuario"}</p>
                  <p className="text-sm text-muted-foreground">{me.email || "-"}</p>
                  <p className="text-sm text-muted-foreground">Rol: {me.rol}</p>
                </div>

                <div className="mt-4">
                  <AvatarUploader
                    disabled={isBusy}
                    onUploaded={(url) => form.setValue("image", url, { shouldDirty: true })}
                    onRemove={() => form.setValue("image", null, { shouldDirty: true })}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={form.handleSubmit((v) => saveMutation.mutate(v))}
                  disabled={isBusy || !form.formState.isDirty}
                  className="inline-flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Guardar
                </Button>
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="contacto">Contacto</TabsTrigger>
                <TabsTrigger value="laboral">Laboral</TabsTrigger>
                <TabsTrigger value="finanzas">Finanzas/Legal</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <Input
                      {...form.register("name")}
                      placeholder="Tu nombre"
                      disabled={isBusy}
                    />
                    {form.formState.errors.name?.message && (
                      <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Email (solo lectura)</Label>
                    <Input value={me.email || ""} disabled />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="personal" className="mt-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CUIL</Label>
                      <Input
                        {...form.register("personalData.cuil")}
                        placeholder="Ej: 20-12345678-3"
                        disabled={isBusy}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de nacimiento</Label>
                      <Input
                        type="date"
                        {...form.register("personalData.fechaNacimiento")}
                        disabled={isBusy}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nacionalidad</Label>
                      <Input
                        {...form.register("personalData.nacionalidad")}
                        placeholder="Ej: Argentina"
                        disabled={isBusy}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estado civil</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        disabled={isBusy}
                        {...form.register("personalData.estadoCivil")}
                      >
                        <option value="">Seleccionar</option>
                        <option value="soltero">Soltero/a</option>
                        <option value="casado">Casado/a</option>
                        <option value="divorciado">Divorciado/a</option>
                        <option value="viudo">Viudo/a</option>
                      </select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Dirección</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Calle</Label>
                        <Input
                          {...form.register("personalData.direccion.calle")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Número</Label>
                        <Input
                          {...form.register("personalData.direccion.numero")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Piso</Label>
                        <Input
                          {...form.register("personalData.direccion.piso")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Depto</Label>
                        <Input
                          {...form.register("personalData.direccion.depto")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Ciudad</Label>
                        <Input
                          {...form.register("personalData.direccion.ciudad")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Provincia</Label>
                        <Input
                          {...form.register("personalData.direccion.provincia")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Código Postal</Label>
                        <Input
                          {...form.register("personalData.direccion.codigoPostal")}
                          disabled={isBusy}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contacto" className="mt-6">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Datos de contacto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Teléfono principal</Label>
                        <Input
                          {...form.register("contactData.telefonoPrincipal")}
                          placeholder="Ej: 11 1234-5678"
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Teléfono secundario</Label>
                        <Input
                          {...form.register("contactData.telefonoSecundario")}
                          placeholder="Opcional"
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Email personal</Label>
                        <Input
                          {...form.register("contactData.emailPersonal")}
                          placeholder="Opcional"
                          disabled={isBusy}
                        />
                        {form.formState.errors.contactData?.emailPersonal?.message && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.contactData.emailPersonal.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Contacto de emergencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Nombre</Label>
                        <Input
                          {...form.register("contactData.contactoEmergencia.nombre")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Parentesco</Label>
                        <Input
                          {...form.register("contactData.contactoEmergencia.parentesco")}
                          disabled={isBusy}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Teléfono</Label>
                        <Input
                          {...form.register("contactData.contactoEmergencia.telefono")}
                          disabled={isBusy}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="laboral" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Puesto</Label>
                    <Input
                      {...form.register("laboralData.puesto")}
                      placeholder="Ej: Técnico / Vendedor"
                      disabled={isBusy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha de ingreso</Label>
                    <Input
                      type="date"
                      {...form.register("laboralData.fechaIngreso")}
                      disabled={isBusy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Equipo</Label>
                    <Input
                      {...form.register("laboralData.equipo")}
                      placeholder="Opcional"
                      disabled={isBusy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reporta a</Label>
                    <Input
                      {...form.register("laboralData.reportaA")}
                      placeholder="Opcional"
                      disabled={isBusy}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="finanzas" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CBU</Label>
                    <Input
                      {...form.register("financieraLegalData.cbu")}
                      placeholder="Opcional"
                      disabled={isBusy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      {...form.register("financieraLegalData.banco")}
                      placeholder="Opcional"
                      disabled={isBusy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Obra social</Label>
                    <Input
                      {...form.register("financieraLegalData.obraSocial")}
                      placeholder="Opcional"
                      disabled={isBusy}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número de afiliado</Label>
                    <Input
                      {...form.register("financieraLegalData.numeroAfiliado")}
                      placeholder="Opcional"
                      disabled={isBusy}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="sticky bottom-4">
          <div className="bg-background/80 backdrop-blur border rounded-xl p-3 shadow-sm flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {form.formState.isDirty ? "Hay cambios sin guardar." : "Todo guardado."}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isBusy || !form.formState.isDirty}
                onClick={() => {
                  if (!me) return;
                  // Reaplica el reset con lo que vino del servidor
                  form.reset(form.getValues()); // fallback rápido
                  qc.invalidateQueries({ queryKey: ["me"] });
                }}
              >
                Descartar
              </Button>

              <Button
                type="button"
                disabled={isBusy || !form.formState.isDirty}
                onClick={form.handleSubmit((v) => saveMutation.mutate(v))}
                className="inline-flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Guardar
              </Button>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Nota: la foto se sube al servidor y se guarda en tu usuario. Luego podés “Guardar” para
          consolidar otros cambios del perfil.
        </p>
      </div>
    </div>
  );
}
