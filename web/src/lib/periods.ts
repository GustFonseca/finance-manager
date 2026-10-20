export type MonthKey = string;

export function monthKeyOf(date: Date): MonthKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function firstDayOf(key: MonthKey): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export function monthRange(key: MonthKey): { start: string; end: string } {
  const start = firstDayOf(key);
  const monthEnd = new Date(start.getFullYear(), start.getMonth() + 1, 1, 0, 0, 0, -1);
  return { start: start.toISOString(), end: monthEnd.toISOString() };
}

export function twelveMonthsUntil(key: MonthKey): { start: string; end: string } {
  const last = firstDayOf(key);
  return { start: new Date(last.getFullYear(), last.getMonth() - 11, 1).toISOString(), end: monthRange(key).end };
}

export function yearRange(year: number): { start: string; end: string } {
  const start = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1, 0, 0, 0, -1);
  return { start: start.toISOString(), end: yearEnd.toISOString() };
}

export function monthLabel(key: MonthKey): string {
  return firstDayOf(key).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function isCurrentMonth(key: MonthKey): boolean {
  return key === monthKeyOf(new Date());
}

export function shortMonthOf(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function longMonthOf(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

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

export function todayKey(): string {
  return isoToDay(new Date().toISOString());
}

export function todayStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export function formatDay(iso: string, options: { utc?: boolean; year?: boolean } = {}): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(options.year === false ? {} : { year: 'numeric' }),
    ...(options.utc ? { timeZone: 'UTC' } : {}),
  });
}
