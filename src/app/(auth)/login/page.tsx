'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

type Language = 'eu' | 'es';

const translations = {
  eu: {
    title: 'IkuSare',
    subtitle: 'Hasi saioa zure kontuan eta jarraitu zure ikusketak.',
    longDescription: 'IkuSare ikus-entzunezkoak partekatzeko sare soziala da, euskarari leku handiagoa emanez. Batu zaitez eta lagundu zer ikusi erabakitzen!',
    email: 'E-posta',
    password: 'Pasahitza',
    signIn: 'Hasi saioa',
    loading: 'Hasten saioa...',
    noAccount: 'Ez duzu konturik?',
    signUp: 'Sortu kontua',
    emailPlaceholder: 'zure@email.eus',
    passwordPlaceholder: '••••••••',
  },
  es: {
    title: 'IkuSare',
    subtitle: 'Inicia sesión y sigue disfrutando de tus películas y series.',
    longDescription: 'IkuSare es la red social donde compartimos cine y series mientras damos más espacio al euskera. Únete y ayúdanos a decidir qué ver!.',
    email: 'Correo electrónico',
    password: 'Contraseña',
    signIn: 'Iniciar sesión',
    loading: 'Iniciando sesión...',
    noAccount: '¿No tienes cuenta?',
    signUp: 'Crear cuenta',
    emailPlaceholder: 'tu@email.es',
    passwordPlaceholder: '••••••••',
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('eu');
  const router = useRouter();

  const t = translations[selectedLanguage];

  const toggleLanguage = () => {
    setSelectedLanguage(prev => prev === 'eu' ? 'es' : 'eu');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: any) {
      setError(
        selectedLanguage === 'eu'
          ? 'E-posta edo pasahitza okerra da.'
          : 'Correo o contraseña incorrectos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Columna izquierda: formulario */}
      <div
        className="w-full md:w-1/2 p-8 flex flex-col justify-center"
        style={{ backgroundColor: '#1D3557' }}
      >
        <div className="max-w-md mx-auto text-white">
          {/* Botón cambio idioma */}
          <div className="flex justify-end mb-6">
            <button
              onClick={toggleLanguage}
              className="font-poppins bg-[#E63946] hover:bg-[#d62e3a] text-white px-4 py-2 rounded-full text-sm font-semibold transition"
            >
              {selectedLanguage === 'eu' ? 'Euskara' : 'Castellano'}
            </button>
          </div>

          <h1 className="font-barriecito text-white text-4xl md:text-5xl leading-tight tracking-wider mb-12 opacity-95 max-w-3xl text-center 
               drop-shadow-2xl 
               bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">{t.title}</h1>
          <p className="font-sans mb-8">{t.subtitle}</p>

          {error && <p className="text-red-300 mb-4 font-sans">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-4 font-sans">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full px-4 py-3 bg-[#457b9d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946]"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.passwordPlaceholder}
              className="w-full px-4 py-3 bg-[#457b9d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-[#E63946] text-white rounded-lg font-poppins font-semibold transition ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#d62e3a]'
              }`}
            >
              {loading ? t.loading : t.signIn}
            </button>
          </form>

          <p className="font-sans text-center text-gray-300 mt-6">
            {t.noAccount}{' '}
            <a href="/signup" className="text-[#E63946] hover:underline font-semibold">
              {t.signUp}
            </a>
          </p>
          {/* Imagen */}
    <img
      src="/images/Logo_IkuSare.svg"
      alt="Ikusare - Dos personas viendo cine"
      className="w-30 h-auto mx-auto"
    />
        </div>
      </div>

      {/* Columna derecha: ilustración + Ikusare en grande */}
<div className="hidden md:flex w-1/2 bg-[#E63946] items-center justify-center p-12">
  <div className="text-center max-w-lg flex flex-col items-center">
    {/* Texto largo dinámico */}
    <p className="font-barriecito text-white text-2xl md:text-3xl leading-tight tracking-wider mb-12 opacity-95 max-w-3xl text-center 
               drop-shadow-2xl 
               bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
  {t.longDescription}
</p>

    {/* Imagen */}
    <img
      src="/images/Logo_IkuSare.svg"
      alt="Ikusare - Dos personas viendo cine"
      className="w-50 h-auto mx-auto"
    />
        </div>
      </div>
    </div>
  );
  
}