export function workHoursOf(cents: number, hourValueCents: number): string | null {
  if (hourValueCents <= 0 || cents <= 0) return null;
  const hours = cents / hourValueCents;
  if (hours < 1) return `≈ ${Math.max(1, Math.round(hours * 60))} min de trabalho`;
  return `≈ ${hours.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h de trabalho`;
}
