"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Paperclip, X } from "lucide-react";
import { IFormField as OriginalFormField } from "@/types/IFormField";
import { Combobox } from "@/components/ui/combobox";

type IFormField = Omit<OriginalFormField, "tipo"> & {
  tipo:
    | "texto"
    | "textarea"
    | "numero"
    | "precio"
    | "fecha"
    | "checkbox"
    | "seleccion"
    | "combobox"
    | "archivo";
};

// Valores posibles del form dinámico
type FormValue = string | number | boolean | string[] | undefined;
type IFormularioData = Record<string, FormValue>;

interface StageFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  formFields: IFormField[];
  onSave: (formData: IFormularioData) => Promise<void>;
  quoteId: string;

  /** Valores precargados (por ej: precio anterior) */
  initialData?: IFormularioData;
}

const toFieldName = (title: string): string => {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
};

export function StageFormModal({
  isOpen,
  onOpenChange,
  title,
  description,
  formFields,
  onSave,
  initialData,
}: StageFormModalProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<IFormularioData>({
    // Importante: que el form nazca con los defaults para evitar resets raros
    defaultValues: initialData || {},
    mode: "onSubmit",
  });

  const [filesToUpload, setFilesToUpload] = useState<Record<string, File[]>>({});

  // Reseteo al abrir + precarga
  useEffect(() => {
    if (isOpen) {
      reset(initialData || {});
      setFilesToUpload({});
    }
  }, [isOpen, reset, initialData]);

  const handleFileChange = (fieldName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFilesToUpload((prev) => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] || []), ...newFiles],
      }));
    }
  };

  const removeFile = (fieldName: string, fileNameToRemove: string) => {
    setFilesToUpload((prev) => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((file) => file.name !== fileNameToRemove),
    }));
  };

  const onSubmit: SubmitHandler<IFormularioData> = async (data) => {
    const finalFormData: IFormularioData = { ...data };

    try {
      const fileUploadPromises: Promise<void>[] = [];

      for (const fieldName in filesToUpload) {
        const files = filesToUpload[fieldName];
        if (files?.length > 0) {
          const uploadPromise = async () => {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            const response = await axios.post("/api/upload", formData);
            finalFormData[fieldName] = response.data.paths;
          };

          const promise = uploadPromise();
          fileUploadPromises.push(promise);

          toast.promise(promise, {
            loading: `Subiendo ${files.length} archivo(s)...`,
            success: "Archivos subidos con éxito.",
            error: "Error al subir archivos.",
          });
        }
      }

      await Promise.all(fileUploadPromises);

      await onSave(finalFormData);

      onOpenChange(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
      toast.error(`Error en el proceso de guardado: ${errorMessage}`);
    }
  };

  /**
   * PRECIO: Solo:
   * - Precio anterior (readonly)
   * - Nuevo precio (editable)
   *
   * Nota: Usamos Controller para el input editable para que NO pierda el foco.
   * Además, lo manejamos como string mientras tipeás; recién se transforma a number al guardar.
   */
  const PrecioField = ({ field }: { field: IFormField }) => {
    const fieldName = toFieldName(field.titulo);
    const isRequired = !!field.requerido;

    const prevValueRaw = initialData?.[fieldName];
    const prevValue =
      typeof prevValueRaw === "number"
        ? prevValueRaw
        : Number(prevValueRaw ?? 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Precio anterior</Label>
          <Input
            // Mostrar como texto evita comportamientos raros del input number
            type="text"
            value={Number.isFinite(prevValue) ? String(prevValue) : "0"}
            disabled
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Nuevo precio {isRequired && <span className="text-red-500">*</span>}
          </Label>

          <Controller
            name={fieldName}
            control={control}
            rules={{
              required: isRequired ? "Este campo es obligatorio." : false,
              validate: (v) => {
                if (!isRequired && (v === undefined || v === "")) return true;
                const asNumber = typeof v === "number" ? v : Number(String(v).replace(",", "."));
                if (!Number.isFinite(asNumber)) return "Ingresá un número válido.";
                if (asNumber < 0) return "El precio no puede ser negativo.";
                return true;
              },
            }}
            render={({ field: controllerField, fieldState }) => (
              <>
                <Input
                  // Clave: type="text" + inputMode="numeric/decimal" para no “pelear” con el navegador
                  // y evitar pérdida de foco por coerciones de type="number".
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 300"
                  value={
                    controllerField.value === undefined
                      ? (Number.isFinite(prevValue) ? String(prevValue) : "")
                      : String(controllerField.value)
                  }
                  onChange={(e) => {
                    // Permitimos escribir muchos dígitos sin que salte el foco.
                    // Acepta: dígitos, coma, punto.
                    const next = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(next) || next === "") {
                      controllerField.onChange(next);
                    }
                  }}
                  onBlur={() => {
                    // Normalizamos al salir (opcional): convertimos coma->punto, y si es número, guardamos number.
                    const raw = String(controllerField.value ?? "");
                    if (raw === "") {
                      controllerField.onBlur();
                      return;
                    }
                    const normalized = raw.replace(",", ".");
                    const num = Number(normalized);
                    if (Number.isFinite(num)) controllerField.onChange(num);
                    controllerField.onBlur();
                  }}
                />

                {fieldState.error?.message && (
                  <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>
      </div>
    );
  };

  const renderField = (field: IFormField) => {
    const fieldName = toFieldName(field.titulo);
    const rules = { required: field.requerido ? "Este campo es obligatorio." : false };

    switch (field.tipo) {
      case "texto":
        return <Input type="text" {...register(fieldName, rules)} />;

      case "textarea":
        return <Textarea {...register(fieldName, rules)} />;

      case "numero":
        // Para numero común: también recomiendo text+inputMode si te hace cosas raras el focus.
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={{
              required: field.requerido ? "Este campo es obligatorio." : false,
              validate: (v) => {
                if (!field.requerido && (v === undefined || v === "")) return true;
                const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
                return Number.isFinite(n) ? true : "Ingresá un número válido.";
              },
            }}
            render={({ field: controllerField, fieldState }) => (
              <>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={controllerField.value === undefined ? "" : String(controllerField.value)}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^[0-9]*$/.test(next) || next === "") controllerField.onChange(next);
                  }}
                  onBlur={() => {
                    const raw = String(controllerField.value ?? "");
                    if (raw === "") return controllerField.onBlur();
                    const n = Number(raw);
                    if (Number.isFinite(n)) controllerField.onChange(n);
                    controllerField.onBlur();
                  }}
                />
                {fieldState.error?.message && (
                  <p className="text-xs text-red-600 mt-1">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        );

      case "precio":
        return <PrecioField field={field} />;

      case "fecha":
        return <Input type="date" {...register(fieldName, rules)} />;

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Controller
              name={fieldName}
              control={control}
              render={({ field: controllerField }) => (
                <Checkbox
                  id={fieldName}
                  checked={!!controllerField.value}
                  onCheckedChange={controllerField.onChange}
                />
              )}
            />
            <Label htmlFor={fieldName} className="text-sm font-normal">
              {field.titulo}
            </Label>
          </div>
        );

      case "seleccion":
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={rules}
            render={({ field: controllerField }) => (
              <Select
                onValueChange={controllerField.onChange}
                defaultValue={controllerField.value as string}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(field.opciones) &&
                    field.opciones.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
        );

      case "combobox": {
        const comboboxOptions = Array.isArray(field.opciones)
          ? field.opciones.map((opt) => ({ value: opt, label: opt }))
          : [];
        return (
          <Controller
            name={fieldName}
            control={control}
            rules={rules}
            render={({ field: controllerField }) => (
              <Combobox
                options={comboboxOptions}
                value={controllerField.value as string}
                onChange={controllerField.onChange}
                placeholder="Buscar y seleccionar..."
              />
            )}
          />
        );
      }

      case "archivo":
        return (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(fieldName)?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" /> Adjuntar Archivos
            </Button>

            <Input
              id={fieldName}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileChange(fieldName, e)}
            />

            <div className="mt-2 space-y-1">
              {(filesToUpload[fieldName] || []).map((file) => (
                <div
                  key={file.name}
                  className="flex items-center justify-between text-xs p-1.5 bg-muted rounded-md"
                >
                  <span className="truncate pr-2">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => removeFile(fieldName, file.name)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      default: {
        const exhaustiveCheck: never = field.tipo;
        return (
          <p className="text-red-500 text-sm">
            Tipo de campo no reconocido: {exhaustiveCheck}
          </p>
        );
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {formFields.map((field) =>
            field.tipo !== "checkbox" ? (
              <div key={field.titulo} className="space-y-2">
                {/* Para precio ya mostramos labels adentro (Precio anterior / Nuevo) */}
                {field.tipo !== "precio" && (
                  <Label>
                    {field.titulo} {field.requerido && <span className="text-red-500">*</span>}
                  </Label>
                )}
                {renderField(field)}
              </div>
            ) : (
              <div key={field.titulo}>{renderField(field)}</div>
            )
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Guardar y Mover"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
