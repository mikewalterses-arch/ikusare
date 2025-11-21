'use client';

import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Check,
  Filter,
  Loader2,
  Save,
  Upload,
} from 'lucide-react';

type AdminContentItem = {
  id: string;
  titulo: string;
  poster?: string;
  plataformas?: string[];
  euskera_manual?: boolean;
  admin_notes?: string;
};

const COLLECTION_NAME = 'catalogo'; // 👈 ajusta al nombre real de tu colección

const ALL_PLATFORMS = [
  'Netflix',
  'HBO Max',
  'Disney+',
  'Prime Video',
  'Filmin',
  'Movistar+',
];

export default function AdminMoviesPage() {
  const [items, setItems] = useState<AdminContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyWithoutEuskeraManual, setOnlyWithoutEuskeraManual] =
    useState(false);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [csvInfo, setCsvInfo] = useState<string | null>(null);
  const [csvApplying, setCsvApplying] = useState(false);

  // Carga inicial del catálogo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const colRef = collection(db, COLLECTION_NAME);
        const snap = await getDocs(colRef);

        const data: AdminContentItem[] = snap.docs.map((d) => {
          const raw = d.data() as any;
          return {
            id: d.id,
            titulo: raw.titulo || raw.title || '',
            poster: raw.poster || '',
            plataformas: raw.plataformas || raw.platforms || [],
            euskera_manual: raw.euskera_manual ?? false,
            admin_notes: raw.admin_notes || '',
          };
        });

        setItems(data);
      } catch (err) {
        console.error('Error loading admin catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Buscador por id/título/plataforma + filtro sin euskera_manual
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      if (onlyWithoutEuskeraManual && item.euskera_manual === true) {
        return false;
      }

      if (!term) return true;

      const matchId = item.id.toLowerCase().includes(term);
      const matchTitle = (item.titulo || '').toLowerCase().includes(term);
      const matchPlatform = (item.plataformas || []).some((p) =>
        p.toLowerCase().includes(term),
      );

      return matchId || matchTitle || matchPlatform;
    });
  }, [items, search, onlyWithoutEuskeraManual]);

  const updateItemField = (
    id: string,
    field: keyof AdminContentItem,
    value: any,
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
  };

  const togglePlatform = (id: string, platform: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const current = it.plataformas || [];
        const exists = current.includes(platform);
        const updated = exists
          ? current.filter((p) => p !== platform)
          : [...current, platform];
        return { ...it, plataformas: updated };
      }),
    );
  };

  const saveItem = async (item: AdminContentItem) => {
    try {
      setSavingIds((prev) => [...prev, item.id]);
      const ref = doc(db, COLLECTION_NAME, item.id);

      await setDoc(
        ref,
        {
          titulo: item.titulo,
          poster: item.poster || '',
          plataformas: item.plataformas || [],
          euskera_manual: item.euskera_manual ?? false,
          admin_notes: item.admin_notes || '',
        },
        { merge: true },
      );
    } catch (err) {
      console.error('Error saving item', item.id, err);
      alert(
        `Error guardando ${item.titulo || item.id}. Revisa la consola para más detalles.`,
      );
    } finally {
      setSavingIds((prev) => prev.filter((x) => x !== item.id));
    }
  };

  // Botón rápido "Marcar como en euskera" (lo que ya tenías, pero mejorado)
  const markAsEuskera = async (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;
    const updated: AdminContentItem = { ...item, euskera_manual: true };
    updateItemField(id, 'euskera_manual', true);
    await saveItem(updated);
  };

  // CSV masivo
  const handleCsvChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Cabecera esperada:
      // id,titulo,poster,plataformas,euskera_manual,admin_notes
      const rows = text.split(/\r?\n/).filter((r) => r.trim() !== '');
      if (rows.length <= 1) {
        setCsvInfo('CSV vacío o solo contiene cabecera.');
        return;
      }

      const header = rows[0].split(',');
      const idxId = header.indexOf('id');
      const idxTitulo = header.indexOf('titulo');
      const idxPoster = header.indexOf('poster');
      const idxPlataformas = header.indexOf('plataformas');
      const idxEuskera = header.indexOf('euskera_manual');
      const idxNotes = header.indexOf('admin_notes');

      if (idxId === -1) {
        setCsvInfo('El CSV debe tener al menos la columna "id".');
        return;
      }

      const updates: AdminContentItem[] = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        if (!cols[idxId]) continue;

        const id = cols[idxId].trim();
        const titulo = idxTitulo !== -1 ? cols[idxTitulo]?.trim() || '' : '';
        const poster = idxPoster !== -1 ? cols[idxPoster]?.trim() || '' : '';
        const plataformasRaw =
          idxPlataformas !== -1 ? cols[idxPlataformas]?.trim() || '' : '';
        const euskeraRaw =
          idxEuskera !== -1 ? cols[idxEuskera]?.trim().toLowerCase() : '';
        const notes = idxNotes !== -1 ? cols[idxNotes]?.trim() || '' : '';

        const plataformas =
          plataformasRaw.length > 0
            ? plataformasRaw.split('|').map((p) => p.trim())
            : [];

        const euskera_manual =
          euskeraRaw === 'true' ||
          euskeraRaw === '1' ||
          euskeraRaw === 'yes' ||
          euskeraRaw === 'si';

        updates.push({
          id,
          titulo,
          poster,
          plataformas,
          euskera_manual,
          admin_notes: notes,
        });
      }

      if (!updates.length) {
        setCsvInfo('No se han encontrado filas válidas en el CSV.');
        return;
      }

      setCsvInfo(
        `CSV leído correctamente. Filas válidas: ${updates.length}. ` +
          'Se aplicarán por id. Plataformas separadas por "|".',
      );

      setCsvApplying(true);
      const batch = writeBatch(db);
      updates.forEach((u) => {
        const ref = doc(db, COLLECTION_NAME, u.id);
        batch.set(
          ref,
          {
            ...(u.titulo ? { titulo: u.titulo } : {}),
            ...(u.poster ? { poster: u.poster } : {}),
            ...(u.plataformas && u.plataformas.length
              ? { plataformas: u.plataformas }
              : {}),
            euskera_manual: u.euskera_manual,
            ...(u.admin_notes ? { admin_notes: u.admin_notes } : {}),
          },
          { merge: true },
        );
      });

      await batch.commit();

    // Refrescar datos en memoria para que el panel quede actualizado
setItems((prev) => {
  const map = new Map(prev.map((p) => [p.id, p]));

  updates.forEach((u) => {
    const existing = map.get(u.id);
    // garantizamos que siempre trabajamos con un array
    const plataformasCsv = u.plataformas ?? [];

    if (existing) {
      map.set(u.id, {
        ...existing,
        ...u,
        plataformas:
          plataformasCsv.length > 0
            ? plataformasCsv
            : existing.plataformas ?? [],
      });
    } else {
      map.set(u.id, {
        ...u,
        plataformas: plataformasCsv,
      });
    }
  });

  return Array.from(map.values());
});


      setCsvInfo(
        (info) =>
          (info || '') + ' ✅ Correcciones masivas aplicadas correctamente.',
      );
    } catch (err) {
      console.error('Error leyendo/aplicando CSV:', err);
      setCsvInfo('Error leyendo o aplicando el CSV. Revisa la consola.');
    } finally {
      setCsvApplying(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-200">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando catálogo…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 text-white">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          Editar Películas / Series
        </h1>
        <p className="text-sm text-slate-300">
          Buscador, euskera_manual, plataformas, notas y CSV masivo.
        </p>
      </header>

      {/* Búsqueda + filtro euskera_manual */}
      <section className="flex flex-col gap-3 rounded-2xl bg-[#1D3557] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-200">
              Buscar por ID, título o plataforma
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: 1234, La sociedad de la nieve, Netflix…"
              className="w-full rounded-xl border border-slate-500 bg-slate-900/40 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400 focus:border-slate-200 focus:ring-1 focus:ring-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-900/40 px-3 py-2 text-xs">
            <Filter className="h-4 w-4 text-slate-200" />
            <label className="flex items-center gap-2 text-slate-100">
              <input
                type="checkbox"
                checked={onlyWithoutEuskeraManual}
                onChange={(e) =>
                  setOnlyWithoutEuskeraManual(e.target.checked)
                }
              />
              <span>Solo sin euskera_manual</span>
            </label>
          </div>
        </div>
      </section>

      {/* Importar CSV */}
      <section className="flex flex-col gap-3 rounded-2xl bg-amber-900/40 p-4 text-xs text-amber-100">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span className="font-semibold">
            Importar CSV para correcciones masivas
          </span>
        </div>
        <p>
          Cabecera recomendada:{' '}
          <code className="rounded bg-amber-800/60 px-1 py-0.5">
            id,titulo,poster,plataformas,euskera_manual,admin_notes
          </code>
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong>id</strong> → ID del documento en Firestore.
          </li>
          <li>
            <strong>plataformas</strong> → separadas por{' '}
            <code className="rounded bg-amber-800/60 px-1 py-0.5">
              |
            </code>{' '}
            (ej: Netflix|Filmin).
          </li>
          <li>
            <strong>euskera_manual</strong> → true/false, 1/0, yes/no, si/no.
          </li>
        </ul>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvChange}
            className="text-xs text-amber-50"
          />
          {csvApplying && (
            <div className="flex items-center gap-2 text-amber-100">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Aplicando correcciones…</span>
            </div>
          )}
        </div>
        {csvInfo && (
          <p className="mt-1 text-[11px] text-amber-100">
            {csvInfo}
          </p>
        )}
      </section>

      {/* Resultados */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>
            Resultados: <strong>{filteredItems.length}</strong> /{' '}
            {items.length}
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-300">
            No hay resultados con los filtros actuales.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredItems.map((item) => {
              const isSaving = savingIds.includes(item.id);
              return (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl bg-slate-900/60 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono text-slate-400">
                        ID: {item.id}
                      </span>
                      <input
                        type="text"
                        value={item.titulo}
                        onChange={(e) =>
                          updateItemField(
                            item.id,
                            'titulo',
                            e.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-2 py-1 text-sm font-medium text-white outline-none placeholder:text-slate-500 focus:border-slate-200 focus:ring-1 focus:ring-slate-200"
                        placeholder="Título"
                      />
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => markAsEuskera(item.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/25"
                      >
                        <Check className="h-3 w-3" />
                        Marcar como en euskera
                      </button>
                      <label className="flex items-center gap-1 text-[11px] text-slate-200">
                        <input
                          type="checkbox"
                          checked={item.euskera_manual ?? false}
                          onChange={(e) =>
                            updateItemField(
                              item.id,
                              'euskera_manual',
                              e.target.checked,
                            )
                          }
                        />
                        <span>euskera_manual</span>
                      </label>
                    </div>
                  </div>

                  {/* Poster URL */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-200">
                      Poster URL
                    </label>
                    <input
                      type="text"
                      value={item.poster || ''}
                      onChange={(e) =>
                        updateItemField(item.id, 'poster', e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-2 py-1 text-xs text-white outline-none placeholder:text-slate-500 focus:border-slate-200 focus:ring-1 focus:ring-slate-200"
                      placeholder="https://…"
                    />
                  </div>

                  {/* Plataformas */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-slate-200">
                      Plataformas
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PLATFORMS.map((plat) => {
                        const active = (item.plataformas || []).includes(
                          plat,
                        );
                        return (
                          <button
                            key={plat}
                            type="button"
                            onClick={() => togglePlatform(item.id, plat)}
                            className={[
                              'rounded-full border px-3 py-1 text-[11px]',
                              active
                                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                                : 'border-slate-600 bg-slate-900 text-slate-200 hover:border-slate-400',
                            ].join(' ')}
                          >
                            {plat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notas admin */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium text-slate-200">
                      Notas del admin
                    </label>
                    <textarea
                      value={item.admin_notes || ''}
                      onChange={(e) =>
                        updateItemField(
                          item.id,
                          'admin_notes',
                          e.target.value,
                        )
                      }
                      rows={3}
                      className="w-full rounded-xl border border-slate-600 bg-slate-950/60 px-2 py-1 text-xs text-white outline-none placeholder:text-slate-500 focus:border-slate-200 focus:ring-1 focus:ring-slate-200"
                      placeholder="Notas internas, correcciones pendientes, etc."
                    />
                  </div>

                  {/* Guardar */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => saveItem(item)}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-900 hover:bg-white disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Guardando…
                        </>
                      ) : (
                        <>
                          <Save className="h-3 w-3" />
                          Guardar cambios
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
