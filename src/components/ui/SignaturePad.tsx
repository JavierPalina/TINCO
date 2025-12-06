"use client";

import { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface Props {
  value: string; // data URL (e.g., "data:image/png;base64,...")
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ value, onChange, disabled }: Props) {
  const sigPadRef = useRef<SignatureCanvas>(null);

  const handleClear = () => {
    sigPadRef.current?.clear();
    onChange("");
  };

  const handleEnd = () => {
    if (sigPadRef.current) {
      onChange(sigPadRef.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  // Cargar el valor inicial (si existe) en el canvas
  useEffect(() => {
    if (sigPadRef.current) {
      // Limpiar primero
      sigPadRef.current.clear();
      // Cargar data si existe y es válida
      if (value && value.startsWith("data:image/png")) {
        sigPadRef.current.fromDataURL(value);
      }
    }
  }, [value]); // Depender solo de 'value'

  return (
    <div className="relative w-full aspect-video border rounded-md bg-white">
      <SignatureCanvas
        ref={sigPadRef}
        penColor="black"
        canvasProps={{ className: 'w-full h-full' }}
        onEnd={handleEnd}
      />
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute top-1 right-1"
        >
          Limpiar
        </Button>
      )}
    </div>
  );
}