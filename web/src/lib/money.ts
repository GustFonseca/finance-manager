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

/** Cents as the text an amount input expects back: `123450` -> `"1.234,50"`. */
export function formatCentsForInput(cents: number): string {
  return (Math.abs(cents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

/**
 * Parses a signed amount as exported by banks into integer cents, accepting
 * both `"-1234.56"` (CSV/OFX) and `"-1.234,56"` (pt-BR). The decimal separator
 * is the last `.` or `,` followed by one or two digits. Returns `null` when the
 * input is not a number. Works on the digits as text, so no float rounding.
 */
export function parseSignedAmountToCents(input: string): number | null {
  let text = input.trim().replace(/R\$|\s/g, '');
  let sign = 1;
  if (text.startsWith('-') || text.endsWith('-')) {
    sign = -1;
    text = text.replace(/-/g, '');
  } else if (text.startsWith('+')) {
    text = text.slice(1);
  }

  const decimal = /[.,](\d{1,2})$/.exec(text);
  const integerPart = (decimal ? text.slice(0, decimal.index) : text).replace(/[.,]/g, '');
  const fraction = decimal ? decimal[1].padEnd(2, '0') : '00';
  if (!/^\d+$/.test(integerPart)) return null;

  return sign * (Number(integerPart) * 100 + Number(fraction));
}
