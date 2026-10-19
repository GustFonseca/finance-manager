const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const INVALID_AMOUNT_MESSAGE = 'Informe um valor válido, por exemplo 150,00.';

export function formatCents(cents: number, options: { signed?: boolean } = {}): string {
  const formatted = BRL.format(Math.abs(cents) / 100);
  if (cents < 0) return `- ${formatted}`;
  if (options.signed && cents > 0) return `+ ${formatted}`;
  return formatted;
}

export function formatCentsCompact(cents: number): string {
  const reais = cents / 100;
  if (Math.abs(reais) < 1000) return `R$ ${Math.round(reais).toLocaleString('pt-BR')}`;
  return `R$ ${(reais / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
}

export function formatCentsForInput(cents: number): string {
  return (Math.abs(cents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const AMOUNT_FORMATS: { pattern: RegExp; thousands: string; decimal: string }[] = [
  { pattern: /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/, thousands: '.', decimal: ',' },
  { pattern: /^\d{1,3}(,\d{3})+\.\d{1,2}$/, thousands: ',', decimal: '.' },
  { pattern: /^\d+(,\d{1,2})?$/, thousands: '', decimal: ',' },
  { pattern: /^\d+\.\d{1,2}$/, thousands: '', decimal: '.' },
];

export function parseAmountToCents(input: string): number | null {
  const text = input.trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  const format = AMOUNT_FORMATS.find((f) => f.pattern.test(text));
  if (!format) return null;
  const plain = (format.thousands ? text.split(format.thousands).join('') : text).replace(format.decimal, '.');
  const [integer, fraction = ''] = plain.split('.');
  return Number(integer) * 100 + Number(fraction.padEnd(2, '0'));
}

export function parseToCents(input: string): number | null {
  const cents = parseAmountToCents(input);
  return cents !== null && cents > 0 ? cents : null;
}

export function parseSignedAmountToCents(input: string): number | null {
  let text = input.trim().replace(/−/g, '-');
  let sign = 1;
  const debitCredit = /(\d)\s*([DC])$/i.exec(text);
  if (debitCredit) {
    if (debitCredit[2].toUpperCase() === 'D') sign = -1;
    text = text.slice(0, debitCredit.index + 1);
  }
  text = text.replace(/R\$|\s/g, '');
  if (/^\(.*\)$/.test(text)) {
    sign = -sign;
    text = text.slice(1, -1);
  }
  if (text.startsWith('-') || text.endsWith('-')) {
    sign = -sign;
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
