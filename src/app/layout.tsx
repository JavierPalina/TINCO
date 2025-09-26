import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TINCO',
  description: "Conectamos mejor, crecemos más rápido",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers> {/* <-- Envuelve a los hijos con el proveedor */}
          {children}
        </Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}