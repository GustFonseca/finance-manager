export { normalizeText } from '@/lib/text';

export function toDay(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function dayToIso(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 12).toISOString();
}

export function isoToDay(iso: string): string {
  const date = new Date(iso);
  return toDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) ?? iso.slice(0, 10);
}
