// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Poppins, Montserrat, Barriecito } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const barriecito = Barriecito({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-barriecito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'IkuSare',
  description: 'IkuSare - Red social de cine y series en euskera',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="eu"
      className={`${inter.variable} ${poppins.variable} ${montserrat.variable} ${barriecito.variable}`}
    >
      <body className="font-sans bg-[#0f172a] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
