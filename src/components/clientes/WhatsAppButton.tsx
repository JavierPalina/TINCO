"use client";
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';

export function WhatsAppButton({ telefono }: { telefono: string }) {
    const handleWhatsAppClick = () => {
        const cleanedPhone = telefono.replace(/[\s()-]+/g, '');
        const whatsappUrl = `https://wa.me/${cleanedPhone.startsWith('54') ? cleanedPhone : '54' + cleanedPhone}`;
        window.open(whatsappUrl, '_blank');
    };
    return (
        <Button 
            size="icon" 
            className="h-7 w-7 bg-primary/10 hover:bg-primary/40 text-primary"
            onClick={handleWhatsAppClick} 
            title={`Enviar WhatsApp a ${telefono}`}
        >
            <FaWhatsapp className="h-4 w-4" />
        </Button>
    );
}