'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type Language = 'eu' | 'es';

const translations = {
  eu: {
    title: 'IkuSare',
    subtitle: 'Sortu zure kontua eta aurkitu edukia zure hizkuntzan.',
    longDescription:
      'IkuSare ikus-entzunezkoak partekatzeko sare soziala da, euskarari leku handiagoa emanez. Batu zaitez eta lagundu zer ikusi erabakitzen!',
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
    success: 'Kontua sortuta! Egiaztatu zure e-posta mezua.',
    usernamePlaceholder: 'Erabiltzaile-izena',
    emailPlaceholder: 'zure@email.eus',
    passwordPlaceholder: '••••••••',
    confirmPasswordPlaceholder: '••••••••',
    googleButton: 'Jarraitu Google kontuarekin',
    emailVerificationInfo:
      'Kontua sortu dugu. Mesedez, egiaztatu zure e-posta Ikusare erabili aurretik.',
  },
  es: {
    title: 'IkuSare',
    subtitle: 'Crea tu cuenta y descubre contenido en tu idioma.',
    longDescription:
      'IkuSare es la red social donde compartimos cine y series mientras damos más espacio al euskera. Únete y ayúdanos a decidir qué ver!.',
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
    success: '¡Cuenta creada! Revisa tu correo para verificarla.',
    usernamePlaceholder: 'Nombre de usuario',
    emailPlaceholder: 'tu@email.es',
    passwordPlaceholder: '••••••••',
    confirmPasswordPlaceholder: '••••••••',
    googleButton: 'Continuar con Google',
    emailVerificationInfo:
      'Hemos creado tu cuenta. Por favor, verifica tu correo antes de usar Ikusare.',
  },
};

export default function SignUpPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('eu');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
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
    setInfo('');

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
      // Crear usuario con email y password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Enviar email de verificación
      await sendEmailVerification(user);

      // Guardar datos básicos en Firestore
      await setDoc(
        doc(db, 'users', user.uid),
        {
          username: username || email.split('@')[0],
          email: email,
          createdAt: new Date().toISOString(),
          languagePreference: selectedLanguage,
          type: 'user', // muy útil para diferenciar admin/user
          provider: 'password',
          emailVerified: false,
        },
        { merge: true }
      );

      setInfo(t.emailVerificationInfo);

      // Redirigimos al login para que pueda entrar después de verificar
      router.push('/login');
    } catch (err: any) {
      console.error('[SignUp] Error:', err);
      setError(err.message || 'Error creando la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(
        doc(db, 'users', user.uid),
        {
          username: user.displayName || user.email?.split('@')[0] || 'user',
          email: user.email,
          createdAt: new Date().toISOString(),
          languagePreference: selectedLanguage,
          type: 'user',
          provider: 'google',
          emailVerified: user.emailVerified ?? true,
        },
        { merge: true }
      );

      router.push('/');
    } catch (err: any) {
      console.error('[SignUp Google] Error:', err);
      setError(err.message || 'Error al iniciar sesión con Google');
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
          {/* Selector de idioma */}
          <div className="flex justify-end mb-6">
            <button
              onClick={toggleLanguage}
              className="font-poppins bg-[#E63946] hover:bg-[#d62e3a] text-white px-4 py-2 rounded-full text-sm font-semibold transition"
              aria-label="Cambiar idioma"
            >
              {selectedLanguage === 'eu' ? 'Castellano' : 'Euskara'}
            </button>
          </div>

          {/* Título */}
          <h1
            className="font-barriecito text-white text-4xl md:text-5xl leading-tight tracking-wider mb-4 opacity-95 max-w-3xl text-center 
               drop-shadow-2xl 
               bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent"
          >
            {t.title}
          </h1>

          {/* Subtítulo */}
          <p className="font-sans mb-4">{t.subtitle}</p>

          {error && <p className="text-red-300 mb-2 font-sans">{error}</p>}
          {info && <p className="text-emerald-300 mb-2 font-sans">{info}</p>}

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

            {/* Botón principal */}
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

          {/* Google */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={loading}
              className="w-full py-3 bg-white text-[#1D3557] rounded-lg font-poppins font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* Icono simple de G */}
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4285F4] text-white text-xs font-bold">
                G
              </span>
              <span>{t.googleButton}</span>
            </button>
          </div>

          {/* Enlace a login */}
          <p className="font-sans text-center text-gray-300 mt-6">
            {t.haveAccount}{' '}
            <a
              href="/login"
              className="text-[#E63946] hover:underline font-semibold"
            >
              {t.signIn}
            </a>
          </p>

          {/* Logo pequeño */}
          <div className="mt-6 flex justify-center">
            <img
              src="/images/Logo_IkuSare.svg"
              alt="Ikusare - Dos personas viendo cine"
              className="w-32 h-auto mx-auto"
            />
          </div>
        </div>
      </div>

      {/* Columna derecha: ilustración + Ikusare en grande */}
      <div className="hidden md:flex w-1/2 bg-[#E63946] items-center justify-center p-12">
        <div className="text-center max-w-lg flex flex-col items-center">
          <p
            className="font-barriecito text-white text-2xl md:text-3xl leading-tight tracking-wider mb-12 opacity-95 max-w-3xl text-center 
               drop-shadow-2xl 
               bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent"
          >
            {t.longDescription}
          </p>

          <img
            src="/images/Logo_IkuSare.svg"
            alt="Ikusare - Dos personas viendo cine"
            className="w-48 h-auto mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
