"use client";

import { Mail, Phone, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  telefono?: string;
  email?: string;
}

export function ContactButtons({ telefono, email }: Props) {
  const handleWhatsAppClick = () => {
    // Limpiamos el número de teléfono: quitamos espacios, paréntesis, guiones
    const cleanedPhone = telefono?.replace(/[\s()-]+/g, '');
    // Asumimos un código de país (ej. 54 para Argentina) si no está presente
    const whatsappUrl = `https://wa.me/${cleanedPhone?.startsWith('54') ? cleanedPhone : '54' + cleanedPhone}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleEmailClick = () => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
        <div className="flex items-center justify-center gap-1 group-hover:opacity-100 transition-opacity">
            {email && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleEmailClick} title={`Enviar email a ${email}`}>
                    <Mail className="h-4 w-4 text-primary" />
                </Button>
            )}
            {telefono && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleWhatsAppClick} title={`Enviar WhatsApp a ${telefono}`}>
                    <MessageSquare className="h-4 w-4 text-primary" />
                </Button>
            )}
        </div>
    );
}