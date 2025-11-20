// src/app/(admin)/admin/movies/[id]/page.tsx

import EditMovieClient from "./EditMovieClient";

export default async function EditMoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 👇 aquí resolvemos la Promise y sacamos el id real
  const { id } = await params;

  return <EditMovieClient id={id} />;
}
