// src/lib/utils.ts

// Utilidad simple para combinar clases CSS de forma segura
export function cn(
    ...classes: Array<string | null | undefined | false>
  ): string {
    return classes.filter(Boolean).join(' ');
  }
  