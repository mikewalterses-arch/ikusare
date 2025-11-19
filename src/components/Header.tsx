// src/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type Language = 'eu' | 'es';

const translations = {
  profile: { eu: 'Profila', es: 'Perfil' },
  settings: { eu: 'Ezarpenak', es: 'Ajustes' },
  signOut: { eu: 'Irten', es: 'Cerrar sesión' },
  languageButton: { eu: 'Castellano', es: 'Euskara' },
};

export default function Header() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('eu');

  useEffect(() => {
    const saved = localStorage.getItem('ikusare-language') as Language;
    if (saved) setLanguage(saved);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'eu' ? 'es' : 'eu';
    setLanguage(newLang);
    localStorage.setItem('ikusare-language', newLang);
  };

  const t = {
    profile: translations.profile[language],
    settings: translations.settings[language],
    signOut: translations.signOut[language],
    languageButton: translations.languageButton[language],
  };

  const user = {
    username: 'mikelvaldivia',
    photoURL: null,
    followers: 0,
    following: 2,
  };

  const avatarSrc = user.photoURL || '/images/default-avatar.svg';

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="bg-[#1D3557] text-white py-5 px-4 sm:px-6 border-b border-white/10 sticky top-0 z-40 backdrop-blur-xl bg-opacity-95">
      <div className="w-full flex items-center justify-between">
        {/* Logo + Nombre */}
        <div
          onClick={() => router.push('/')}
          className="cursor-pointer flex items-center gap-3 group"
        >
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wider transition group-hover:text-[#E63946] drop-shadow-md"
            style={{ fontFamily: "'Barriecito', cursive" }}
          >
            IkuSare
          </h1>
        </div>

        {/* Derecha: Desplegable de usuario + idioma */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 hover:bg-white/10 rounded-2xl px-3 sm:px-4 py-2 transition-all duration-300"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden ring-3 ring-[#E63946]/40 shadow-xl">
              <Image
                src={avatarSrc}
                alt={user.username}
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-medium hidden md:block">{user.username}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute right-0 mt-3 w-80 bg-gray-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden z-50">
                {/* Cabecera */}
                <div className="px-6 py-5 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-[#E63946]/50">
                      <Image src={avatarSrc} alt={user.username} width={64} height={64} className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-xl">{user.username}</p>
                      <div className="flex gap-5 text-sm text-gray-300 mt-2">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          {user.followers}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {user.following}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opciones */}
                <div className="py-3">
                  <button
                    onClick={() => { router.push('/profile'); setIsOpen(false); }}
                    className="w-full px-6 py-4 flex items-center gap-4 hover:bg:white/10 transition text-left"
                  >
                    {/* ... resto igual que tenías ... */}
                  </button>
                  {/* resto del dropdown igual que tu código */}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
