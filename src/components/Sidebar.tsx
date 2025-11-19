// src/components/Sidebar.tsx
'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home, Search, User, BookOpen, LogOut } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();

  return (
    <div className="w-16 bg-[#1D3557] h-screen fixed left-0 top-0 flex flex-col items-center pt-6 space-y-8">
      {/* Logo */}
      <div className="mb-8">
        <Image
          src="/images/Logo_IkuSare_Solo.svg"
          alt="IkuSare"
          width={48}
          height={48}
          className="rounded-lg"
        />
      </div>

      {/* Navegación principal */}
      <div className="flex flex-col space-y-6">
        <button
          onClick={() => router.push('/')}
          className="group relative p-3 rounded-xl transition-all duration-200 hover:bg-[#E63946]/20"
          aria-label="Inicio"
        >
          <Home className="w-6 h-6 text-white group-hover:text-[#E63946] transition" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            Hasiera
          </span>
        </button>

        <button
          onClick={() => router.push('/search')}
          className="group relative p-3 rounded-xl transition-all duration-200 hover:bg-[#E63946]/20"
          aria-label="Buscar"
        >
          <Search className="w-6 h-6 text-gray-400 group-hover:text-[#E63946] transition" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            Bilatu
          </span>
        </button>

        <button
          onClick={() => router.push('/profile')}
          className="group relative p-3 rounded-xl transition-all duration-200 hover:bg-[#E63946]/20"
          aria-label="Perfil"
        >
          <User className="w-6 h-6 text-gray-400 group-hover:text-[#E63946] transition" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            Profila
          </span>
        </button>

        <button
          onClick={() => router.push('/journal')}
          className="group relative p-3 rounded-xl transition-all duration-200 hover:bg-[#E63946]/20"
          aria-label="Diario"
        >
          <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-[#E63946] transition" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            Egunkaria
          </span>
        </button>
      </div>

      {/* Cerrar sesión (abajo del todo) */}
      <div className="mt-auto mb-8">
        <button
          onClick={() => {
            // Aquí pondrás tu lógica de logout
            console.log('Cerrar sesión');
          }}
          className="group relative p-3 rounded-xl transition-all duration-200 hover:bg-red-500/20"
          aria-label="Cerrar sesión"
        >
          <LogOut className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition" />
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
            Irten
          </span>
        </button>
      </div>
    </div>
  );
}