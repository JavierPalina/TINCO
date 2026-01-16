// /app/dashboard/configuracion/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import {
  Building2,
  ExternalLink,
  Loader2,
  Mail,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  CreditCard,
  Image as ImageIcon,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Sucursal = {
  _id: string;
  nombre: string;
  direccion: string;
  linkPagoAbierto?: string;
  cbu?: string;
  email?: string;
  qrPagoAbiertoImg?: string; // data-uri base64 o URL
  aliasImg?: string; // data-uri base64 o URL
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type SucursalFormState = {
  nombre: string;
  direccion: string;
  linkPagoAbierto: string;
  cbu: string;
  email: string;
  qrPagoAbiertoImg: string;
  aliasImg: string;
};

const EMPTY_FORM: SucursalFormState = {
  nombre: "",
  direccion: "",
  linkPagoAbierto: "",
  cbu: "",
  email: "",
  qrPagoAbiertoImg: "",
  aliasImg: "",
};

function truncate(text: string | null | undefined, max: number) {
  if (!text) return "-";
  const t = String(text).trim();
  if (!t) return "-";
  return t.length > max ? t.slice(0, max).trim() + "..." : t;
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

function FieldRow({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex items-start gap-2">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-sm break-words">{value}</div>
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function ImageChip({
  label,
  present,
  onView,
}: {
  label: string;
  present: boolean;
  onView: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onView}
      disabled={!present}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
        present ? "hover:bg-accent" : "opacity-50 cursor-not-allowed text-muted-foreground"
      )}
      title={present ? `Ver ${label}` : `Sin ${label}`}
    >
      <ImageIcon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  busy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void>;
  busy?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground">{description}</div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpsertSucursalDialog({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial: SucursalFormState;
  onSubmit: (payload: SucursalFormState, mode: "create" | "edit") => Promise<void>;
}) {
  const [form, setForm] = useState<SucursalFormState>(initial);
  const [saving, setSaving] = useState(false);

  const [imgPreview, setImgPreview] = useState<{ title: string; src: string } | null>(null);

  useEffect(() => {
    setForm(initial);
  }, [initial, open]);

  const setField = (k: keyof SucursalFormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handlePickImg = async (k: "qrPagoAbiertoImg" | "aliasImg", file?: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setField(k, dataUrl);
  };

  const submit = async () => {
    if (!form.nombre.trim()) {
      alert("El Nombre de la sucursal es obligatorio.");
      return;
    }
    if (!form.direccion.trim()) {
      alert("La Dirección de la sucursal es obligatoria.");
      return;
    }

    try {
      setSaving(true);
      await onSubmit(
        {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
          linkPagoAbierto: form.linkPagoAbierto.trim(),
          cbu: form.cbu.trim(),
          email: form.email.trim(),
          qrPagoAbiertoImg: form.qrPagoAbiertoImg || "",
          aliasImg: form.aliasImg || "",
        },
        mode
      );
      onOpenChange(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Agregar Sucursal" : "Editar Sucursal"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-1">
              <Label>Nombre de la sucursal *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
                placeholder="Ej: Casa Central / Sucursal Norte"
              />
            </div>

            <div className="grid gap-1">
              <Label>Dirección de la sucursal *</Label>
              <Input
                value={form.direccion}
                onChange={(e) => setField("direccion", e.target.value)}
                placeholder="Ej: Av. Siempre Viva 742, CABA"
              />
            </div>

            <div className="grid gap-1">
              <Label>Link de Pago Abierto</Label>
              <Input
                value={form.linkPagoAbierto}
                onChange={(e) => setField("linkPagoAbierto", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-1">
                <Label>CBU</Label>
                <Input value={form.cbu} onChange={(e) => setField("cbu", e.target.value)} />
              </div>

              <div className="grid gap-1">
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="sucursal@dominio.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">QR de Pago Abierto</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setField("qrPagoAbiertoImg", "")}
                    disabled={!form.qrPagoAbiertoImg}
                  >
                    Quitar
                  </Button>
                </div>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePickImg("qrPagoAbiertoImg", e.target.files?.[0])}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {form.qrPagoAbiertoImg ? "Imagen cargada" : "Sin imagen"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      form.qrPagoAbiertoImg &&
                      setImgPreview({ title: "QR de Pago Abierto", src: form.qrPagoAbiertoImg })
                    }
                    disabled={!form.qrPagoAbiertoImg}
                  >
                    Ver
                  </Button>
                </div>
              </div>

              <div className="grid gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">Alias (Imagen)</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setField("aliasImg", "")}
                    disabled={!form.aliasImg}
                  >
                    Quitar
                  </Button>
                </div>

                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePickImg("aliasImg", e.target.files?.[0])}
                />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {form.aliasImg ? "Imagen cargada" : "Sin imagen"}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      form.aliasImg && setImgPreview({ title: "Alias (Imagen)", src: form.aliasImg })
                    }
                    disabled={!form.aliasImg}
                  >
                    Ver
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Las imágenes se guardan como <span className="font-medium">data-uri/base64</span>.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview imagen */}
      <Dialog open={Boolean(imgPreview)} onOpenChange={(v) => !v && setImgPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imgPreview?.title}</DialogTitle>
          </DialogHeader>

          {imgPreview?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgPreview.src} alt={imgPreview.title} className="w-full h-auto rounded-lg border" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ConfiguracionPage() {
  const qc = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 400);

  const queryKey = useMemo(() => ["sucursales", debouncedSearchTerm], [debouncedSearchTerm]);

  const { data, isLoading, isError, isFetching } = useQuery<Sucursal[]>({
    queryKey,
    queryFn: async () => {
      const res = await axios.get("/api/sucursales", {
        params: { searchTerm: debouncedSearchTerm },
      });
      return res.data.data as Sucursal[];
    },
    placeholderData: keepPreviousData,
  });

  // Upsert
  const [upsertOpen, setUpsertOpen] = useState(false);
  const [upsertMode, setUpsertMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Sucursal | null>(null);

  const initialForm = useMemo<SucursalFormState>(() => {
    if (!editing) return EMPTY_FORM;
    return {
      nombre: editing.nombre || "",
      direccion: editing.direccion || "",
      linkPagoAbierto: editing.linkPagoAbierto || "",
      cbu: editing.cbu || "",
      email: editing.email || "",
      qrPagoAbiertoImg: editing.qrPagoAbiertoImg || "",
      aliasImg: editing.aliasImg || "",
    };
  }, [editing]);

  const openCreate = () => {
    setEditing(null);
    setUpsertMode("create");
    setUpsertOpen(true);
  };

  const openEdit = (s: Sucursal) => {
    setEditing(s);
    setUpsertMode("edit");
    setUpsertOpen(true);
  };

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Sucursal | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const askDelete = (s: Sucursal) => {
    setDeleting(s);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleting?._id) return;
    try {
      setDeletingBusy(true);
      await axios.delete(`/api/sucursales/${deleting._id}`);
      setDeleteOpen(false);
      setDeleting(null);
      await qc.invalidateQueries({ queryKey: ["sucursales"] });
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "Error al eliminar.");
    } finally {
      setDeletingBusy(false);
    }
  };

  const onSubmitUpsert = async (payload: SucursalFormState, mode: "create" | "edit") => {
    if (mode === "create") {
      await axios.post("/api/sucursales", payload);
    } else {
      if (!editing?._id) throw new Error("Sucursal inválida para editar.");
      // Si agregaste PUT en el API podés usar axios.put(...)
      await axios.patch(`/api/sucursales/${editing._id}`, payload);
    }
    await qc.invalidateQueries({ queryKey: ["sucursales"] });
  };

  // Preview imagen desde cards
  const [imgPreview, setImgPreview] = useState<{ title: string; src: string } | null>(null);

  const rows = data || [];

  if (isLoading) return <div className="p-10 text-center">Cargando...</div>;
  if (isError) return <div className="p-10 text-center text-red-600">Error al cargar.</div>;

  return (
    <div className="mx-auto py-6 px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">Gestioná sucursales y su configuración de cobro.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={openCreate} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Agregar sucursal
          </Button>
        </div>
      </div>

      {/* Search + status */}
      <div className="mt-4 flex flex-col md:flex-row md:items-end gap-3">
        <div className="grid gap-1 flex-1">
          <Label className="text-sm">Buscar</Label>
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, dirección, link, CBU, email..."
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2">
          {isFetching ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Actualizando...
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {rows.length} {rows.length === 1 ? "sucursal" : "sucursales"}
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div
        className={cn(
          "mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
          isFetching ? "opacity-60 transition-opacity" : "opacity-100 transition-opacity"
        )}
      >
        {rows.length === 0 ? (
          <Card className="sm:col-span-2 xl:col-span-3">
            <CardHeader>
              <CardTitle>No hay sucursales</CardTitle>
              <CardDescription>Creá la primera sucursal para guardar su configuración.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openCreate} className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Agregar sucursal
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {rows.map((s) => (
          <Card key={s._id} className="overflow-hidden p-0">
            {/* Header con acento primary */}
            <div className="border-b bg-primary/5">
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Sucursal</div>
                      <div className="font-semibold leading-5 break-words">{truncate(s.nombre, 60)}</div>
                      <div className="text-sm text-muted-foreground break-words">{truncate(s.direccion, 90)}</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => askDelete(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-4 grid gap-3">
              <FieldRow
                icon={<ExternalLink className="h-4 w-4" />}
                label="Link de Pago Abierto"
                value={
                  s.linkPagoAbierto ? (
                    <a
                      href={s.linkPagoAbierto}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline text-primary"
                    >
                      {truncate(s.linkPagoAbierto, 60)}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )
                }
              />

              <FieldRow
                icon={<CreditCard className="h-4 w-4" />}
                label="CBU"
                value={s.cbu ? truncate(s.cbu, 40) : <span className="text-muted-foreground">-</span>}
              />

              <FieldRow
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={
                  s.email ? (
                    <a className="hover:underline text-primary" href={`mailto:${s.email}`}>
                      {truncate(s.email, 60)}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )
                }
              />

              <div className="pt-1">
                <div className="text-xs text-muted-foreground mb-2">Imágenes</div>
                <div className="flex flex-wrap gap-2">
                  <ImageChip
                    label="QR Pago Abierto"
                    present={Boolean(s.qrPagoAbiertoImg)}
                    onView={() =>
                      s.qrPagoAbiertoImg && setImgPreview({ title: "QR de Pago Abierto", src: s.qrPagoAbiertoImg })
                    }
                  />
                  <ImageChip
                    label="Alias"
                    present={Boolean(s.aliasImg)}
                    onView={() => s.aliasImg && setImgPreview({ title: "Alias (Imagen)", src: s.aliasImg })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upsert */}
      <UpsertSucursalDialog
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
        mode={upsertMode}
        initial={initialForm}
        onSubmit={onSubmitUpsert}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar sucursal"
        description={`Vas a eliminar la sucursal: "${deleting?.nombre || ""}". Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onConfirm={confirmDelete}
        busy={deletingBusy}
      />

      {/* Preview imagen desde cards */}
      <Dialog open={Boolean(imgPreview)} onOpenChange={(v) => !v && setImgPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{imgPreview?.title}</DialogTitle>
          </DialogHeader>

          {imgPreview?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgPreview.src} alt={imgPreview.title} className="w-full h-auto rounded-lg border max-h-[70vh] object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
