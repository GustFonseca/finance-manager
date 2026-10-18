import { MonthKey } from '@/lib/periods';
import { CalendarDayDto, CalendarItemKind } from './types';

export const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export type CalendarCell = { day: number; data: CalendarDayDto | undefined } | null;

export function buildGrid(monthKey: MonthKey, days: CalendarDayDto[]): CalendarCell[] {
  const [year, month] = monthKey.split('-').map(Number);
  const leading = new Date(year, month - 1, 1).getDay();
  const length = new Date(year, month, 0).getDate();
  const byDay = new Map(days.map((d) => [new Date(d.date).getUTCDate(), d]));
  const cells: CalendarCell[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= length; day++) cells.push({ day, data: byDay.get(day) });
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function kindsOf(day: CalendarDayDto | undefined): CalendarItemKind[] {
  return Array.from(new Set((day?.items ?? []).map((item) => item.kind)));
}

export function formatDayTitle(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}
