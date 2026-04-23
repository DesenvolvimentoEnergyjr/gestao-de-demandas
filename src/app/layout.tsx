import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastContainer } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Energy Júnior - Gestão de Demandas',
  description: 'Sistema interno de gestão de demandas e projetos da Energy Júnior.',
  icons: {
    icon: '/logo-energy.svg',
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
