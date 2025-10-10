"use client";

import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export interface RejectionFormData {
  motivoRechazo: string;
  detalleRechazo?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RejectionFormData) => void;
  isSubmitting: boolean;
}

export function RejectionReasonModal({ isOpen, onClose, onSubmit, isSubmitting }: Props) {
  const { control, handleSubmit, register, reset } = useForm<RejectionFormData>();

  const handleFormSubmit: SubmitHandler<RejectionFormData> = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Motivo de la Pérdida</DialogTitle>
          <DialogDescription>
            Por favor, especifica por qué no se concretó este negocio. Esta información es muy valiosa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div>
            <Label>Motivo Principal</Label>
            <Controller
              name="motivoRechazo"
              control={control}
              rules={{ required: "Debes seleccionar un motivo." }}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un motivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Precio">Precio</SelectItem>
                    <SelectItem value="Tiempos de entrega">Tiempos de entrega</SelectItem>
                    <SelectItem value="Competencia">Eligió a la competencia</SelectItem>
                    <SelectItem value="No responde">Dejó de responder</SelectItem>
                    <SelectItem value="Producto no adecuado">El producto no era lo que buscaba</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label htmlFor="detalleRechazo">Detalles Adicionales (Opcional)</Label>
            <Textarea
              id="detalleRechazo"
              placeholder="Ej: La competencia ofreció un 10% de descuento..."
              {...register("detalleRechazo")}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Confirmar Pérdida"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}