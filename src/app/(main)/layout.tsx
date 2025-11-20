'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import '../globals.css';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="bg-[#0f172a] text-white min-h-screen overflow-x-hidden">
      {/* SIDEBAR */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* CONTENIDO */}
      <div className="md:ml-16 min-h-screen flex flex-col">
        <Header onToggleSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}