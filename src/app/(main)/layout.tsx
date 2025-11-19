// src/app/(main)/layout.tsx

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import '../globals.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0f172a] text-white min-h-screen overflow-x-hidden">
      {/* SIDEBAR FIJO */}
      <Sidebar />

      {/* CONTENIDO DESPLAZADO SIEMPRE 64px */}
      <div className="ml-16 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
