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

export function longMonthOf(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
