// src/app/(main)/content/[id]/page.tsx

import ContentDetailClient from "./ContentDetailClient";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ContentDetailClient id={id} />;
}
