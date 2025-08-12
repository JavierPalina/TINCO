import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers'; // <-- Importa el proveedor

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CRM Aberturas',
  description: 'El mejor CRM del mercado',
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
      </body>
    </html>
  );
}