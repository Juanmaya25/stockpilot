import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import './globals.css';

const mono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StockPilot — Inventory & POS with an AI copilot',
  description:
    'Multi-tenant inventory & point-of-sale SaaS with an AI assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${mono.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
