'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Language = 'eu' | 'es';

const translations = {
  eu: {
    title: 'IkuSare',
    subtitle: 'Sortu zure kontua eta aurkitu edukia zure hizkuntzan.',
    longDescription:'IkuSare ikus-entzunezkoak partekatzeko sare soziala da, euskarari leku handiagoa emanez. Batu zaitez eta lagundu zer ikusi erabakitzen!',
    username: 'Erabiltzaile-izena',
    email: 'E-posta',
    password: 'Pasahitza',
    confirmPassword: 'Pasahitza berretsi',
    signUp: 'Sortu kontua',
    haveAccount: 'Kontua duzu?',
    signIn: 'Hasi saioa',
    passwordMismatch: 'Pasahitzak ez datoz bat',
    invalidUsername: 'Letra, zenbaki eta azpimarrak soilik',
    creating: 'Kontua sortzen...',
    success: 'Kontua sortuta!',
    usernamePlaceholder: 'Erabiltzaile-izena',
    emailPlaceholder: 'zure@email.eus',
    passwordPlaceholder: '••••••••',
    confirmPasswordPlaceholder: '••••••••',
  },
  es: {
    title: 'IkuSare',
    subtitle: 'Crea tu cuenta y descubre contenido en tu idioma.',
    longDescription:'IkuSare es la red social donde compartimos cine y series mientras damos más espacio al euskera. Únete y ayúdanos a decidir qué ver!.',
    username: 'Nombre de usuario',
    email: 'Correo electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar contraseña',
    signUp: 'Crear cuenta',
    haveAccount: '¿Ya tienes cuenta?',
    signIn: 'Iniciar sesión',
    passwordMismatch: 'Las contraseñas no coinciden',
    invalidUsername: 'Solo letras, números y guiones bajos',
    creating: 'Creando cuenta...',
    success: '¡Cuenta creada!',
    usernamePlaceholder: 'Nombre de usuario',
    emailPlaceholder: 'tu@email.es',
    passwordPlaceholder: '••••••••',
    confirmPasswordPlaceholder: '••••••••',
  },
};

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('eu');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const t = translations[selectedLanguage];

  const toggleLanguage = () => {
    const newLang = selectedLanguage === 'eu' ? 'es' : 'eu';
    setSelectedLanguage(newLang);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(t.invalidUsername);
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        username: username || email.split('@')[0],
        email: email,
        createdAt: new Date().toISOString(),
        languagePreference: selectedLanguage,
      });

      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Columna izquierda: formulario */}
      <div
        className="w-full md:w-1/2 p-8 flex flex-col justify-center"
        style={{ backgroundColor: '#1D3557' }} // 💙 igual que tu versión que sí funciona
      >
        <div className="max-w-md mx-auto text-white">
          {/* Selector de idioma */}
          <div className="flex justify-end mb-6">
            <button
              onClick={toggleLanguage}
              className="font-poppins bg-[#E63946] hover:bg-[#d62e3a] text-white px-4 py-2 rounded-full text-sm font-semibold transition"
              aria-label="Cambiar idioma"
            >
              {selectedLanguage === 'eu' ? 'Euskara' : 'Castellano'}
            </button>
          </div>

          {/* Título con Poppins */}
          <h1 className="font-barriecito text-white text-4xl md:text-5xl leading-tight tracking-wider mb-12 opacity-95 max-w-3xl text-center 
               drop-shadow-2xl 
               bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">{t.title}</h1>
          {/* Subtítulo con Inter (font-sans) */}
          <p className="font-sans mb-8">{t.subtitle}</p>

          {error && <p className="text-red-300 mb-4 font-sans">{error}</p>}

          <form onSubmit={handleSignUp} className="space-y-4 font-sans">
            {/* Username */}
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.usernamePlaceholder}
                className="w-full px-4 py-3 bg-[#457b9d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946]"
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full px-4 py-3 bg-[#457b9d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                required
              />
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                className="w-full px-4 py-3 bg-[#457b9d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t.confirmPasswordPlaceholder}
                className="w-full px-4 py-3 bg-[#457b9d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                required
              />
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-[#E63946] text-white rounded-lg font-poppins font-semibold transition ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#d62e3a]'
              }`}
            >
              {loading ? t.creating : t.signUp}
            </button>
          </form>

          <p className="font-sans text-center text-gray-300 mt-6">
            {t.haveAccount}{' '}
            <a
              href="/login"
              className="text-[#E63946] hover:underline font-semibold"
            >
              {t.signIn}
            </a>
            {/* Imagen */}
    <img
      src="/images/Logo_IkuSare.svg"
      alt="Ikusare - Dos personas viendo cine"
      className="w-30 h-auto mx-auto"
    />
          </p>
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
