// src/components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home, Search, User, BookOpen, LogOut, Settings } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const data = snap.data();
        setIsAdmin(data?.type === 'admin');
      } catch (error) {
        console.error('Error leyendo tipo de usuario:', error);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const NavButton = ({
    icon: Icon,
    label,
    path,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
  }) => (
    <button
      onClick={() => {
        router.push(path);
        onClose?.(); // cierra el drawer en móvil
      }}
      className="group relative p-3 rounded-xl transition-all duration-200 hover:bg-[#E63946]/20"
      aria-label={label}
    >
      <Icon className="w-6 h-6 text-gray-300 group-hover:text-[#E63946] transition" />
      {/* Tooltip solo en desktop */}
      <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none hidden md:block">
        {label}
      </span>
    </button>
  );

  return (
    <>
      {/* BACKDROP para móvil */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed left-0 top-0 h-screen w-16 bg-[#1D3557] flex flex-col items-center pt-6 space-y-8 z-50
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
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
          <NavButton icon={Home} label="Hasiera" path="/" />
          <NavButton icon={Search} label="Bilatu" path="/search" />
          <NavButton icon={User} label="Profila" path="/profile" />
          <NavButton icon={BookOpen} label="Egunkaria" path="/journal" />

          {/* Botón de Admin solo si type === 'admin' en Firestore */}
          {isAdmin && (
            <NavButton icon={Settings} label="Konfigurazioa" path="/admin" />
          )}
        </div>

        {/* Cerrar sesión abajo del todo (de momento solo consola) */}
        <div className="mt-auto mb-8">
          <button
            onClick={() => {
              console.log('Cerrar sesión (implementa aquí tu lógica de logout)');
              onClose?.();
            }}
            className="group relative p-3 rounded-xl transition-all duration-200 hover:bg-red-500/20"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-6 h-6 text-gray-400 group-hover:text-red-400 transition" />
          </button>
        </div>
      </div>
    </>
  );
}
