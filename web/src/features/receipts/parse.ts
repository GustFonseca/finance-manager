import type { CompanyDto } from '@/features/merchants/types';
import { isoToDay, toDay } from '@/lib/periods';

export type PaymentMethod = 'CREDIT' | 'DEBIT' | 'PIX' | 'CASH';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CREDIT: 'Cartão de crédito',
  DEBIT: 'Cartão de débito',
  PIX: 'Pix',
  CASH: 'Dinheiro',
};

export type NfceQr = {
  accessKey: string;
  cnpj: string;
  year: number;
  month: number;
};

export type ReceiptField = 'total' | 'date' | 'cnpj' | 'name' | 'payment';

export type ReceiptFound = Record<ReceiptField, boolean>;

export type ReceiptFields = {
  totalCents: number | null;
  day: string | null;
  time: string | null;
  cnpj: string | null;
  merchantName: string | null;
  payment: PaymentMethod | null;
};

export type ReceiptText = ReceiptFields & {
  found: ReceiptFound;
  confidence: number;
};

export type ReceiptData = ReceiptText & {
  accessKey: string | null;
  activity: string | null;
};

type Line = { raw: string; text: string };

const ACCESS_KEY = /(?:^|\D)(\d{44})(?!\d)/;
const AMOUNT = /(^|[^\d.,/])(\d{1,3}(?:[.,]\d{3})+|\d+)[.,](\d{2})(?!\d|[.,/]\d)/g;
const DATE = /(^|\D)(\d{2})[/.-](\d{2})[/.-](\d{4}|\d{2})(?!\d)/g;
const TIME = /(^|\D)([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?!\d)/;
const CNPJ =
  /(^|[^0-9A-Z])([0-9A-Z]{2})[.,\s]{0,2}([0-9A-Z]{3})[.,\s]{0,2}([0-9A-Z]{3})[/\s]{0,2}([0-9A-Z]{4})[-.\s]{0,2}(\d{2})(?!\d)/g;

const TOTAL_LABELS = [/\bVALOR A PAGAR\b/, /\bTOTAL A PAGAR\b/, /\bTOTAL ?R\$/, /\bVALOR TOTAL\b/, /\bTOTAL\b/];
const NOT_TOTAL = /ITENS|TRIBUT|IMPOSTO|DESCONTO|TROCO|ACRESCIMO/;
const DATE_LABEL = /EMISSAO|DATA/;
const NOT_PURCHASE_DATE = /\b(LOTE|LT|VAL|VALIDADE|VENC|VENCIMENTO|FAB|FABRICACAO)\b/;
const TAGLINE = /\b(BEM[- ]VINDO|VOLTE SEMPRE|OBRIGAD[OA]|SEJA BEM|AGRADECE)/;
const NOT_NAME =
  /\b(CNPJ|IE|I\.E|INSC|CPF|ENDERECO|END|RUA|R|AV|AVENIDA|ROD|CEP|TEL|FONE|BAIRRO|DOCUMENTO|DANFE|NFC|NF|NOTA|CUPOM|EXTRATO|SAT|CONSUMIDOR|FISCAL)\b/;
const PAYMENTS: [RegExp, PaymentMethod][] = [
  [/\bCREDITO\b/, 'CREDIT'],
  [/\bDEBITO\b/, 'DEBIT'],
  [/\bPIX\b/, 'PIX'],
  [/\bDINHEIRO\b/, 'CASH'],
];
const LOWER_WORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
const UPPER_WORDS = new Set(['SA', 'S/A', 'ME', 'EPP', 'EIRELI']);
const NAME_SCAN_WITHOUT_CNPJ = 3;
const MAX_DIGITS_IN_LINE = 44;

const onlyDigits = (text: string) => text.replace(/\D/g, '');

export function accessKeyCheckDigit(first43: string): number {
  let sum = 0;
  let weight = 2;
  for (let index = first43.length - 1; index >= 0; index--) {
    sum += Number(first43[index]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

const cnpjChars = (text: string) => text.toUpperCase().replace(/[^0-9A-Z]/g, '');

function cnpjDigit(chars: string, length: number): number {
  let sum = 0;
  let weight = length - 7;
  for (let index = 0; index < length; index++) {
    sum += (chars.charCodeAt(index) - 48) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCnpj(value: string): boolean {
  const chars = cnpjChars(value);
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars) || /^(.)\1+$/.test(chars)) return false;
  return cnpjDigit(chars, 12) === Number(chars[12]) && cnpjDigit(chars, 13) === Number(chars[13]);
}

export function formatCnpj(cnpj: string): string {
  const d = cnpjChars(cnpj);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

export function parseNfceQr(text: string): NfceQr | null {
  const match = ACCESS_KEY.exec(text.replace(/\s+/g, ''));
  if (!match) return null;
  const key = match[1];
  if (accessKeyCheckDigit(key.slice(0, 43)) !== Number(key[43])) return null;
  const month = Number(key.slice(4, 6));
  if (month < 1 || month > 12) return null;
  return { accessKey: key, cnpj: key.slice(6, 20), year: 2000 + Number(key.slice(2, 4)), month };
}

const stripAccents = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '');

function fixNumbers(text: string): string {
  let current = text;
  let previous: string;
  do {
    previous = current;
    current = current
      .replace(/(\d[.,]?)O/g, (_, before: string) => `${before}0`)
      .replace(/(^|[^A-Z])O(?=[.,]?\d)/g, (_, before: string) => `${before}0`)
      .replace(/([A-Z])0(?=[A-Z])/g, (_, before: string) => `${before}O`);
  } while (current !== previous);
  return current.replace(/(\d) ?([.,]) ?(\d{2})(?!\d)/g, (_, whole: string, separator: string, cents: string) => `${whole}${separator}${cents}`);
}

export function normalizeLine(raw: string): string {
  const upper = stripAccents(raw).toUpperCase().replace(/\s+/g, ' ').trim().replace(/R \$/g, 'R$');
  return fixNumbers(upper);
}

function linesOf(ocrText: string): Line[] {
  return ocrText
    .split(/\r?\n/)
    .map((raw) => ({ raw: raw.replace(/\s+/g, ' ').trim(), text: normalizeLine(raw) }))
    .filter((line) => line.text !== '');
}

export function amountsOf(text: string): number[] {
  return Array.from(text.matchAll(AMOUNT), (match) => Number(match[2].replace(/[.,]/g, '')) * 100 + Number(match[3]));
}

function firstAmountAfter(text: string, from: number): { cents: number; at: number } | null {
  for (const match of text.slice(from).matchAll(AMOUNT)) {
    const cents = Number(match[2].replace(/[.,]/g, '')) * 100 + Number(match[3]);
    if (cents > 0) return { cents, at: from + match.index! + match[1].length };
  }
  return null;
}

function totalNear(lines: Line[], index: number, labelEnd: number): number | null {
  const text = lines[index].text;
  const onLine = firstAmountAfter(text, labelEnd);
  if (onLine) return NOT_TOTAL.test(text.slice(0, onLine.at)) ? null : onLine.cents;
  if (NOT_TOTAL.test(text)) return null;
  const next = lines[index + 1]?.text;
  if (!next || /[A-Z]{3,}/.test(next)) return null;
  const [below] = amountsOf(next);
  return below || null;
}

type Total = { cents: number; index: number };

function findTotal(lines: Line[]): Total | null {
  for (const label of TOTAL_LABELS) {
    for (let index = 0; index < lines.length; index++) {
      const match = label.exec(lines[index].text);
      if (!match) continue;
      const cents = totalNear(lines, index, match.index + match[0].length);
      if (cents) return { cents, index };
    }
  }
  return null;
}

type Dated = { day: string; index: number };

function findDate(lines: Line[], today: string): Dated | null {
  const candidates: (Dated & { labeled: boolean })[] = [];
  lines.forEach((line, index) => {
    for (const match of line.text.matchAll(DATE)) {
      const year = match[4].length === 2 ? 2000 + Number(match[4]) : Number(match[4]);
      const day = year >= 2000 ? toDay(year, Number(match[3]), Number(match[2])) : null;
      if (!day || day > today) continue;
      const labeled = DATE_LABEL.test(line.text) || DATE_LABEL.test(lines[index - 1]?.text ?? '');
      candidates.push({ day, index, labeled });
    }
  });
  const purchase = candidates.filter((candidate) => !NOT_PURCHASE_DATE.test(lines[candidate.index].text));
  const chosen =
    candidates.find((candidate) => candidate.labeled) ??
    purchase.find((candidate) => timeOf(lines[candidate.index].text)) ??
    purchase[0] ??
    candidates[0];
  return chosen ? { day: chosen.day, index: chosen.index } : null;
}

function timeOf(text: string): string | null {
  const match = TIME.exec(text);
  return match ? `${match[2]}:${match[3]}` : null;
}

function findTime(lines: Line[], dated: Dated | null): string | null {
  const onDateLine = dated ? timeOf(lines[dated.index].text) : null;
  if (onDateLine) return onDateLine;
  for (const line of lines) {
    const time = timeOf(line.text);
    if (time) return time;
  }
  return null;
}

type Located = { cnpj: string; index: number };

function cnpjIn(text: string): string | null {
  if (onlyDigits(text).length >= MAX_DIGITS_IN_LINE) return null;
  const labeled = text.includes('CNPJ');
  for (const match of text.matchAll(CNPJ)) {
    const chars = match.slice(2, 7).join('');
    if ((labeled || /^\d+$/.test(chars)) && isValidCnpj(chars)) return chars;
  }
  return null;
}

function findCnpj(lines: Line[]): Located | null {
  const order = [
    ...lines.map((line, index) => ({ line, index })).filter(({ line }) => line.text.includes('CNPJ')),
    ...lines.map((line, index) => ({ line, index })).filter(({ line }) => !line.text.includes('CNPJ')),
  ];
  for (const { line, index } of order) {
    const cnpj = cnpjIn(line.text);
    if (cnpj) return { cnpj, index };
  }
  return null;
}

function looksLikeName(text: string): boolean {
  const letters = (text.match(/[A-Z]/g) ?? []).length;
  const visible = text.replace(/\s/g, '').length;
  return (
    letters >= 3 && letters / visible >= 0.7 && /[A-Z]{2,}/.test(text) && !NOT_NAME.test(text) && !TAGLINE.test(text)
  );
}

export function titleCase(name: string): string {
  return name
    .replace(/[^\p{L}\d&./'\- ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word, index) => {
      if (UPPER_WORDS.has(word.toUpperCase())) return word.toUpperCase();
      const lower = word.toLocaleLowerCase('pt-BR');
      if (index > 0 && LOWER_WORDS.has(lower)) return lower;
      return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
    })
    .join(' ');
}

function findName(lines: Line[], cnpj: Located | null): string | null {
  const scope = lines.slice(0, cnpj ? cnpj.index : NAME_SCAN_WITHOUT_CNPJ);
  const line = scope.find((candidate) => looksLikeName(candidate.text));
  return line ? titleCase(line.raw) : null;
}

function paymentIn(text: string): PaymentMethod | null {
  const hits = PAYMENTS.map(([pattern, method]) => ({ method, at: text.search(pattern) })).filter((hit) => hit.at >= 0);
  hits.sort((a, b) => a.at - b.at);
  return hits[0]?.method ?? null;
}

function findPayment(lines: Line[], total: Total | null): PaymentMethod | null {
  const hits = lines
    .map((line, index) => ({ method: paymentIn(line.text), index }))
    .filter((hit): hit is { method: PaymentMethod; index: number } => hit.method !== null);
  if (!total) return hits[0]?.method ?? null;
  const distance = (index: number) => (index >= total.index ? index - total.index : lines.length + total.index - index);
  hits.sort((a, b) => distance(a.index) - distance(b.index));
  return hits[0]?.method ?? null;
}

function summarize<T extends ReceiptFields>(fields: T): T & { found: ReceiptFound; confidence: number } {
  const found: ReceiptFound = {
    total: fields.totalCents !== null,
    date: fields.day !== null,
    cnpj: fields.cnpj !== null,
    name: fields.merchantName !== null,
    payment: fields.payment !== null,
  };
  const key = [found.total, found.date, found.cnpj, found.name];
  return { ...fields, found, confidence: key.filter(Boolean).length / key.length };
}

export function parseReceiptText(ocrText: string, now: Date = new Date()): ReceiptText {
  const lines = linesOf(ocrText);
  const dated = findDate(lines, isoToDay(now.toISOString()));
  const cnpj = findCnpj(lines);
  const total = findTotal(lines);
  return summarize({
    totalCents: total?.cents ?? null,
    day: dated?.day ?? null,
    time: findTime(lines, dated),
    cnpj: cnpj?.cnpj ?? null,
    merchantName: findName(lines, cnpj),
    payment: findPayment(lines, total),
  });
}

export function mergeReceipt(qr: NfceQr | null, text: ReceiptText | null, company: CompanyDto | null): ReceiptData {
  const companyName = company?.name ? titleCase(company.name) : null;
  return {
    ...summarize({
      totalCents: text?.totalCents ?? null,
      day: text?.day ?? null,
      time: text?.time ?? null,
      cnpj: qr?.cnpj ?? text?.cnpj ?? null,
      merchantName: companyName ?? text?.merchantName ?? null,
      payment: text?.payment ?? null,
    }),
    accessKey: qr?.accessKey ?? null,
    activity: company?.activity ?? null,
  };
}
