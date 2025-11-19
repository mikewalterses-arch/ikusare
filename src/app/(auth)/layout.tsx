// src/app/(auth)/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IkuSare - Saioa hasi',
  description: 'Inicia sesión o regístrate en IkuSare',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} bg-[#0f172a] text-white min-h-screen`}>
      {children}
    </div>
  );
}
