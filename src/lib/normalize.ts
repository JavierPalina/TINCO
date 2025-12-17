// /lib/normalize.ts
export function normalizePrioridad(value?: unknown): string {
  const s = String(value ?? '').trim().toLowerCase();
  if (!s) return '';

  const map: Record<string, string> = {
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
  };

  return map[s] ?? (s.charAt(0).toUpperCase() + s.slice(1));
}
