// src/app/(admin)/admin/movies/layout.tsx

import type { ReactNode } from 'react';

export default function AdminMoviesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Aquí podrías meter un título fijo, breadcrumbs, etc. */}
      {children}
    </div>
  );
}