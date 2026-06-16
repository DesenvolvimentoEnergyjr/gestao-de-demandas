import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `Gestão de Demandas - ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Empresa Júnior'}`,
  description: `Sistema interno de gestão de demandas e projetos da ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Empresa Júnior'}.`,
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
