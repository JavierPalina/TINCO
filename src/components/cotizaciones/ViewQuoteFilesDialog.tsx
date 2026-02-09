"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Paperclip } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type FileItem =
  | string
  | { url?: string; name?: string; uid?: string };

type Props = {
  files: FileItem[];
  quoteCode: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

function isImageUrl(url: string) {
  // soporta querystrings (?v=1) y mayúsculas
  return /\.(jpeg|jpg|gif|png|webp)$/i.test(url.split("?")[0]);
}

function fileLabelFromUrl(url: string) {
  const clean = url.split("?")[0];
  return clean.split("/").pop() || "archivo";
}

export function ViewQuoteFilesDialog({ files, quoteCode, isOpen, onOpenChange }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivos Adjuntos de {quoteCode}</DialogTitle>
          <DialogDescription>Visualiza o descarga los archivos asociados a esta cotización.</DialogDescription>
        </DialogHeader>

        <div className="py-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
          {Array.isArray(files) && files.length > 0 ? (
            files.map((file, index) => {
              const url = typeof file === "string" ? file : file?.url;
              if (!url || typeof url !== "string") return null;

              const label = typeof file === "string" ? fileLabelFromUrl(url) : (file.name || fileLabelFromUrl(url));

              return (
                <Link
                  key={(typeof file === "string" ? url : file.uid) ?? index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded-lg p-2 flex flex-col items-center justify-center gap-2 hover:bg-muted"
                >
                  {isImageUrl(url) ? (
                    <Image src={url} alt={`Archivo ${index + 1}`} width={80} height={80} className="object-cover rounded-md" />
                  ) : (
                    <Paperclip className="h-10 w-10" />
                  )}
                  <span className="text-xs text-center break-all">{label}</span>
                </Link>
              );
            })
          ) : (
            <p className="col-span-full text-center text-muted-foreground">No hay archivos adjuntos.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
