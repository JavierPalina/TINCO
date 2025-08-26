"use client";
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmailButton({ email }: { email: string }) {
    const handleEmailClick = () => {
        window.location.href = `mailto:${email}`;
    };
    return (
        <Button 
            size="icon"
            className="h-7 w-7 bg-primary hover:bg-primary/90 text-primary-foreground" 
            onClick={handleEmailClick} 
            title={`Enviar email a ${email}`}
        >
            <Mail className="h-4 w-4" />
        </Button>
    );
}