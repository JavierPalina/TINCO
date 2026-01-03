"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

export function AvatarUploader({
  onUploaded,
  onRemove,
  disabled,
}: {
  onUploaded: (url: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("El archivo debe ser una imagen");
    if (file.size > 4 * 1024 * 1024) return toast.error("La imagen no puede superar 4MB");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const { data } = await axios.post("/api/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = data?.data?.image as string | undefined;
      if (!url) throw new Error("Respuesta inválida del servidor");

      onUploaded(url);
      toast.success("Foto subida");
    } catch (err: any) {
      toast.error(err?.message || "Error subiendo foto");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isDisabled = disabled || uploading;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={isDisabled}
        className="inline-flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Subiendo..." : "Cambiar foto"}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={isDisabled}
        className="inline-flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Quitar
      </Button>
    </div>
  );
}
