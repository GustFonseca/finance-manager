import { parseSignedAmountToCents } from '@/lib/money';
import { normalizeText, toDay } from './text';
import { ImportRow, ParsedStatement } from './types';

export class StatementError extends Error {}

const LEGACY_CHARSET = /CHARSET:\s*(1252|ISO-?8859-?1|LATIN-?1)/i;

export function decodeStatement(buffer: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
  text = text.replace(/^\uFEFF/, '');
  if (LEGACY_CHARSET.test(text.slice(0, 500))) return new TextDecoder('windows-1252').decode(buffer);
  return text;
}

export function parseStatement(text: string): ParsedStatement {
  if (/<OFX>|<STMTTRN>|OFXHEADER/i.test(text)) return { source: 'ofx', rows: parseOfx(text) };

  const table = parseCsv(text);
  const [header, ...lines] = table;
  const columns = (header ?? []).map(normalizeText);
  if (sameColumns(columns, ['data', 'valor', 'identificador', 'descricao'])) {
    return { source: 'nubank-account', rows: lines.map(parseAccountLine) };
  }
  const card = ['date', 'title', 'amount'].map((name) => columns.indexOf(name));
  if (card.every((index) => index >= 0)) {
    return { source: 'nubank-card', rows: lines.map((line, i) => parseCardLine(card.map((c) => line[c]), i)) };
  }
  const generic = findGenericHeader(table);
  if (generic) return { source: 'generic-csv', rows: parseGenericLines(table, generic) };
  throw new StatementError(
    'Formato não reconhecido. Use o CSV da fatura ou do extrato do Nubank, um arquivo OFX ou uma planilha CSV com colunas de data, descrição e valor.'
  );
}

const HEADER_SEARCH_ROWS = 10;
const SEPARATORS = [';', ',', '\t'];
const DATE_HEADER = /^(data|date|dt)\b/;
const PRIMARY_DESCRIPTION_HEADER = /^descri/;
const DESCRIPTION_HEADER = /descri|historico|title|titulo|lancamento|estabelecimento|memo|detalhe/;
const AMOUNT_HEADER = /^(valor|amount|value|quantia)\b/;
const FOREIGN_AMOUNT = /us\$|usd|cotacao|dolar/;
const CREDIT_HEADER = /^(credito|entrada)/;
const DEBIT_HEADER = /^(debito|saida)/;
const CARD_HEADER = /cartao|parcela/;
const KIND_HEADER = /^tipo\b/;
const CARD_KIND = /^(compra|parcela)/;
const SUMMARY_ROW = /^(saldo|total)\b/;

type GenericHeader = {
  row: number;
  date: number;
  description: number;
  detail: number;
  amount: number;
  credit: number;
  debit: number;
  card: boolean;
};

function readHeader(columns: string[], row: number): Omit<GenericHeader, 'card'> | null {
  const date = columns.findIndex((c) => DATE_HEADER.test(c));
  const primary = columns.findIndex((c, i) => i !== date && PRIMARY_DESCRIPTION_HEADER.test(c));
  const other = columns.findIndex((c, i) => i !== date && i !== primary && DESCRIPTION_HEADER.test(c));
  const description = primary >= 0 ? primary : other;
  const detail = primary >= 0 ? other : -1;
  const free = (c: string, i: number) => i !== date && i !== description && i !== detail && !FOREIGN_AMOUNT.test(c);
  const amount = columns.findIndex((c, i) => free(c, i) && AMOUNT_HEADER.test(c));
  const credit = columns.findIndex((c, i) => free(c, i) && CREDIT_HEADER.test(c));
  const debit = columns.findIndex((c, i) => free(c, i) && DEBIT_HEADER.test(c));
  const hasAmount = amount >= 0 || (credit >= 0 && debit >= 0);
  return date >= 0 && description >= 0 && hasAmount ? { row, date, description, detail, amount, credit, debit } : null;
}

function findGenericHeader(table: string[][]): GenericHeader | null {
  for (let row = 0; row < Math.min(table.length, HEADER_SEARCH_ROWS); row++) {
    const columns = table[row].map(normalizeText);
    const header = readHeader(columns, row);
    if (!header) continue;
    const kind = columns.findIndex((c) => KIND_HEADER.test(c));
    const card =
      header.amount >= 0 &&
      (columns.some((c) => CARD_HEADER.test(c)) ||
        (kind >= 0 && table.slice(row + 1).some((line) => CARD_KIND.test(normalizeText(line[kind] ?? '')))));
    return { ...header, card };
  }
  return null;
}

function parseFlexibleDate(raw: string): string | null {
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(raw);
  if (iso) return toDay(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const local = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(raw.split(/\s/)[0]);
  if (!local) return null;
  const year = local[3].length === 2 ? 2000 + Number(local[3]) : Number(local[3]);
  return toDay(year, Number(local[2]), Number(local[1]));
}

function rawAmountOf(line: string[], header: GenericHeader): { raw: string; sign: number } {
  if (header.amount >= 0) return { raw: line[header.amount] ?? '', sign: header.card ? -1 : 1 };
  const credit = line[header.credit] ?? '';
  if (credit) return { raw: credit.replace(/^[-+]/, ''), sign: 1 };
  return { raw: (line[header.debit] ?? '').replace(/^[-+]/, ''), sign: -1 };
}

function descriptionOf(line: string[], header: GenericHeader): string {
  const description = line[header.description] ?? '';
  const detail = header.detail >= 0 ? line[header.detail] ?? '' : '';
  return [detail, description].filter(Boolean).join(' - ');
}

function parseGenericLines(table: string[][], header: GenericHeader): ImportRow[] {
  const rows: ImportRow[] = [];
  table.slice(header.row + 1).forEach((line, index) => {
    const lineNumber = header.row + index + 2;
    const { raw: rawAmount, sign } = rawAmountOf(line, header);
    const rawDate = line[header.date] ?? '';
    if (!rawAmount || !rawDate || SUMMARY_ROW.test(normalizeText(line[header.description] ?? ''))) return;
    const isoDay = parseFlexibleDate(rawDate);
    if (!isoDay) throw new StatementError(`Linha ${lineNumber} inválida: data "${rawDate}"`);
    const parsed = parseSignedAmountToCents(rawAmount);
    if (parsed === null) throw new StatementError(`Linha ${lineNumber} inválida: valor "${rawAmount}"`);
    const cents = sign * parsed;
    if (cents === 0) return;
    rows.push({
      key: `csv-${index}`,
      date: isoDay,
      description: descriptionOf(line, header),
      amountCents: Math.abs(cents),
      type: cents < 0 ? 'EXPENSE' : 'INCOME',
    });
  });
  return rows;
}

function sameColumns(actual: string[], expected: string[]) {
  return expected.every((column, i) => actual[i] === column);
}

function looksLikeHeader(cells: string[]): boolean {
  const columns = cells.map(normalizeText);
  const date = columns.findIndex((c) => DATE_HEADER.test(c));
  return date >= 0 && columns.some((c, i) => i !== date && /valor|amount|value|credito|debito/.test(c));
}

function detectSeparator(text: string): string {
  const head = text.split(/\r?\n/, HEADER_SEARCH_ROWS);
  for (const line of head) {
    const separator = SEPARATORS.find((candidate) => looksLikeHeader(line.split(candidate)));
    if (separator) return separator;
  }
  const joined = head.join('\n');
  return SEPARATORS.reduce((best, candidate) =>
    joined.split(candidate).length > joined.split(best).length ? candidate : best
  );
}

export function parseCsv(text: string): string[][] {
  const separator = detectSeparator(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  return rows
    .map((cells) => cells.map((cell) => cell.trim()))
    .filter((cells) => cells.some((cell) => cell !== ''));
}

function lineError(index: number, detail: string): StatementError {
  return new StatementError(`Linha ${index + 2} inválida: ${detail}`);
}

function amountOf(raw: string, index: number): number {
  const cents = parseSignedAmountToCents(raw ?? '');
  if (cents === null || cents === 0) throw lineError(index, `valor "${raw}"`);
  return cents;
}

function parseCardLine([date, title, amount]: string[], index: number): ImportRow {
  const [year, month, day] = (date ?? '').split('-').map(Number);
  const isoDay = toDay(year, month, day);
  if (!isoDay) throw lineError(index, `data "${date}"`);
  const cents = amountOf(amount, index);
  return {
    key: `card-${index}`,
    date: isoDay,
    description: title ?? '',
    amountCents: Math.abs(cents),
    type: cents > 0 ? 'EXPENSE' : 'INCOME',
  };
}

function parseAccountLine([date, amount, id, description]: string[], index: number): ImportRow {
  const [day, month, year] = date.split('/').map(Number);
  const isoDay = toDay(year, month, day);
  if (!isoDay) throw lineError(index, `data "${date}"`);
  const cents = amountOf(amount, index);
  return {
    key: `${id || 'account'}-${index}`,
    date: isoDay,
    description: description ?? '',
    amountCents: Math.abs(cents),
    type: cents < 0 ? 'EXPENSE' : 'INCOME',
  };
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return String.fromCodePoint(value);
    }
    return ENTITIES[code.toLowerCase()] ?? entity;
  });
}

function joinOfxText(name: string, memo: string): string {
  const [n, m] = [normalizeText(name), normalizeText(memo)];
  if (!n || m.includes(n)) return memo;
  if (!m || n.includes(m)) return name;
  return `${name} - ${memo}`;
}

function parseOfx(text: string): ImportRow[] {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi) ?? [];
  if (blocks.length === 0) throw new StatementError('O arquivo OFX não tem transações.');

  return blocks.map((block, index) => {
    const tag = (name: string) =>
      decodeEntities(new RegExp(`<${name}>([^<\\r\\n]*)`, 'i').exec(block)?.[1].trim() ?? '');
    const posted = tag('DTPOSTED');
    const isoDay = toDay(Number(posted.slice(0, 4)), Number(posted.slice(4, 6)), Number(posted.slice(6, 8)));
    if (!isoDay) throw new StatementError(`Transação ${index + 1} com data inválida: "${posted}"`);
    const cents = parseSignedAmountToCents(tag('TRNAMT'));
    if (!cents) throw new StatementError(`Transação ${index + 1} com valor inválido: "${tag('TRNAMT')}"`);
    const description = joinOfxText(tag('NAME'), tag('MEMO'));
    return {
      key: `${tag('FITID') || 'ofx'}-${index}`,
      date: isoDay,
      description,
      amountCents: Math.abs(cents),
      type: cents < 0 ? 'EXPENSE' : 'INCOME',
    };
  });
}
