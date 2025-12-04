"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  helper?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles: number;
  folder: string;
};

export function CloudinaryMultiUpload({
  label,
  helper,
  value,
  onChange,
  maxFiles,
  folder,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    if (value.length >= maxFiles) return;
    inputRef.current?.click();
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = maxFiles - value.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) return;

    setIsUploading(true);
    try {
      const newUrls: string[] = [];

      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const { data } = await axios.post(
          `/api/uploads/cloudinary?folder=${encodeURIComponent(folder)}`,
          formData,
        );

        if (data?.success && data.url) {
          newUrls.push(data.url);
        }
      }

      if (newUrls.length) {
        onChange([...value, ...newUrls]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = (url: string) => {
    onChange(value.filter((u) => u !== url));
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {helper && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}

      <div className="flex flex-wrap gap-3">
        {value.map((url) => (
          <div
            key={url}
            className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted flex items-center justify-center"
          >
            {/* imagen o icono genérico */}
            {url.match(/\.(mp4|mov|webm)$/i) ? (
              <ImageIcon className="h-6 w-6 opacity-60" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt="upload"
                className="h-full w-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < maxFiles && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClick}
            disabled={isUploading}
            className="h-20 w-20 flex-col gap-1"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-5 w-5" />
                <span className="text-[10px] leading-tight text-center">
                  Subir
                </span>
              </>
            )}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFiles}
      />
      <p className="text-[10px] text-muted-foreground">
        {value.length}/{maxFiles} archivos
      </p>
    </div>
  );
}
