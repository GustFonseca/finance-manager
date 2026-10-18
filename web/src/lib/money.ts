const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

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

export function parseToCents(input: string): number | null {
  const normalized = input.trim().replace(/\./g, '').replace(',', '.');
  if (!normalized) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

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
