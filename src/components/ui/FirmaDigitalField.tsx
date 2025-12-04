"use client";

import { useRef, useState } from "react";
import axios from "axios";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function FirmaDigitalField({ value, onChange }: Props) {
  const sigRef = useRef<SignatureCanvas | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClear = () => {
    sigRef.current?.clear();
  };

  const handleDelete = () => {
    onChange("");
    sigRef.current?.clear();
  };

  const handleSave = async () => {
    if (!sigRef.current) return;
    if (sigRef.current.isEmpty()) return;

    setIsUploading(true);
    try {
      const dataUrl = sigRef.current.toDataURL("image/png");
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      const formData = new FormData();
      formData.append("file", blob, "firma.png");

      const { data } = await axios.post(
        "/api/uploads/cloudinary?folder=tinco/visitas-tecnicas/firmas",
        formData,
      );

      if (data?.success && data.url) {
        onChange(data.url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>Firma / usuario que verificó</Label>

      {value && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Firma"
            className="h-16 border rounded bg-white"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="border rounded-md bg-background">
        <SignatureCanvas
          ref={sigRef}
          penColor="black"
          canvasProps={{
            width: 400,
            height: 160,
            className: "bg-white rounded-md",
          }}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={isUploading}
        >
          Limpiar
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar firma"
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Dibujá la firma y hacé clic en "Guardar firma". Se sube a Cloudinary y
        se guarda la URL en la visita técnica.
      </p>
    </div>
  );
}
