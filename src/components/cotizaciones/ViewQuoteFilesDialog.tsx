"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Paperclip } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  files: string[];
  quoteCode: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewQuoteFilesDialog({ files, quoteCode, isOpen, onOpenChange }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archivos Adjuntos de {quoteCode}</DialogTitle>
          <DialogDescription>
            Visualiza o descarga los archivos asociados a esta cotización.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
          {files && files.length > 0 ? (
            files.map((file, index) => (
              <Link key={index} href={file} target="_blank" rel="noopener noreferrer" className="border rounded-lg p-2 flex flex-col items-center justify-center gap-2 hover:bg-muted">
                {file.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                  <Image src={file} alt={`Archivo ${index + 1}`} width={80} height={80} className="object-cover rounded-md" />
                ) : (
                  <Paperclip className="h-10 w-10" />
                )}
                <span className="text-xs text-center break-all">{file.split('/').pop()}</span>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">No hay archivos adjuntos.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}