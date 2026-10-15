/**
 * Money is represented as integer cents everywhere in the app to avoid
 * floating-point rounding errors. These helpers are the single source of
 * truth for converting between cents and the pt-BR formatted strings shown
 * to (and typed by) the user.
 */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Formats integer cents as Brazilian Real, e.g. `123456` -> `"R$ 1.234,56"`.
 * - Negative amounts are prefixed with `- `.
 * - With `signed`, positive amounts are prefixed with `+ `.
 */
export function formatCents(cents: number, options: { signed?: boolean } = {}): string {
  const formatted = BRL.format(Math.abs(cents) / 100);
  if (cents < 0) return `- ${formatted}`;
  if (options.signed && cents > 0) return `+ ${formatted}`;
  return formatted;
}

/**
 * Parses a user-typed pt-BR amount (e.g. `"1.234,56"` or `"150,00"`) into
 * integer cents. Returns `null` when the input is not a valid positive number.
 */
export function parseToCents(input: string): number | null {
  const normalized = input.trim().replace(/\./g, '').replace(',', '.');
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}
