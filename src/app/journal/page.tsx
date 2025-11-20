// src/app/journal/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function JournalPage() {
  const [title, setTitle] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [timesWatched, setTimesWatched] = useState<number>(1);
  const [dateWatched, setDateWatched] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAddEntry = async () => {
    if (!title) {
      setError('Por favor, introduce el título de la película.');
      return;
    }

    setLoading(true);

    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('No hay usuario autenticado');

      await setDoc(doc(db, 'journals', `${user.uid}_${Date.now()}`), {
        title,
        rating,
        timesWatched, // ya es un número
        dateWatched,
        createdAt: new Date().toISOString(),
        userId: user.uid,
      });

      // Limpiar formulario
      setTitle('');
      setRating(0);
      setTimesWatched(1);
      setDateWatched(new Date().toISOString().split('T')[0]);

      // Redirigir a la lista de entradas
      router.push('/journal');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-[#1D3557] mb-6">
          Mi Diario de Películas
        </h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Añadir entrada</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddEntry();
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título de la película"
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Calificación:</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        star <= rating ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Tu calificación: {rating || 'No valorada'}
                </p>
              </div>

              <div>
                <label className="block mb-2">Veces vistas:</label>
                <input
                  type="number"
                  value={timesWatched}
                  onChange={(e) => setTimesWatched(Number(e.target.value))}
                  min={1}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                  required
                />
              </div>

              <div>
                <label className="block mb-2">Fecha vista:</label>
                <input
                  type="date"
                  value={dateWatched}
                  onChange={(e) => setDateWatched(e.target.value)}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#E63946]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 bg-[#E63946] text-white rounded-lg font-medium transition ${
                  loading
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:bg-[#d62e3a]'
                }`}
              >
                {loading ? 'Guardando...' : 'Añadir entrada'}
              </button>
            </form>
          </div>

          {/* Lista de entradas (simulada) */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Entradas recientes</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded">
                <h3 className="font-medium">Go!azen</h3>
                <p className="text-sm text-gray-500">
                  📅 Nov 19, 2025 • ⭐ 4/5 • 1 vez vista
                </p>
              </div>
              <div className="p-4 border rounded">
                <h3 className="font-medium">Loreak</h3>
                <p className="text-sm text-gray-500">
                  📅 Nov 15, 2025 • ⭐ 5/5 • 2 veces vistas
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
