/** Lower-case, accent-free and single-spaced, for comparing bank texts. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** `yyyy-mm-dd`, or `null` when the parts aren't a real calendar day. */
export function toDay(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Noon local time on that day, so the timezone shift can't move the date. */
export function dayToIso(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 12).toISOString();
}

/** The local `yyyy-mm-dd` of an ISO timestamp returned by the API. */
export function isoToDay(iso: string): string {
  const date = new Date(iso);
  return toDay(date.getFullYear(), date.getMonth() + 1, date.getDate()) ?? iso.slice(0, 10);
}
