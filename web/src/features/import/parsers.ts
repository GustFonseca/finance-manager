import { parseSignedAmountToCents } from '@/lib/money';
import { normalizeText, toDay } from './text';
import { ImportRow, ParsedStatement } from './types';

export class StatementError extends Error {}

export function decodeStatement(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder('utf-8').decode(buffer).replace(/^﻿/, '');
  if (/CHARSET:\s*1252/i.test(utf8.slice(0, 500))) {
    return new TextDecoder('windows-1252').decode(buffer);
  }
  return utf8;
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
const DATE_HEADER = /^(data|date|dt)\b/;
const DESCRIPTION_HEADER = /descri|historico|title|titulo|lancamento|estabelecimento|memo|detalhe/;
const AMOUNT_HEADER = /^(valor|amount|value|quantia)\b/;

type GenericHeader = { row: number; date: number; description: number; amount: number };

function findGenericHeader(table: string[][]): GenericHeader | null {
  for (let row = 0; row < Math.min(table.length, HEADER_SEARCH_ROWS); row++) {
    const columns = table[row].map(normalizeText);
    const date = columns.findIndex((c) => DATE_HEADER.test(c));
    const description = columns.findIndex((c, i) => i !== date && DESCRIPTION_HEADER.test(c));
    const amount = columns.findIndex((c, i) => i !== date && i !== description && AMOUNT_HEADER.test(c));
    if (date >= 0 && description >= 0 && amount >= 0) return { row, date, description, amount };
  }
  return null;
}

function parseFlexibleDate(raw: string): string | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw);
  if (iso) return toDay(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const local = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(raw.split(/\s/)[0]);
  if (!local) return null;
  const year = local[3].length === 2 ? 2000 + Number(local[3]) : Number(local[3]);
  return toDay(year, Number(local[2]), Number(local[1]));
}

function parseGenericLines(table: string[][], header: GenericHeader): ImportRow[] {
  const rows: ImportRow[] = [];
  table.slice(header.row + 1).forEach((line, index) => {
    const lineNumber = header.row + index + 2;
    const rawAmount = line[header.amount] ?? '';
    const rawDate = line[header.date] ?? '';
    if (!rawAmount && !rawDate) return;
    const isoDay = parseFlexibleDate(rawDate);
    if (!isoDay) throw new StatementError(`Linha ${lineNumber} inválida: data "${rawDate}"`);
    const cents = parseSignedAmountToCents(rawAmount);
    if (cents === null) throw new StatementError(`Linha ${lineNumber} inválida: valor "${rawAmount}"`);
    if (cents === 0) return;
    rows.push({
      key: `csv-${index}`,
      date: isoDay,
      description: line[header.description] ?? '',
      amountCents: Math.abs(cents),
      type: cents < 0 ? 'EXPENSE' : 'INCOME',
    });
  });
  return rows;
}

function sameColumns(actual: string[], expected: string[]) {
  return expected.every((column, i) => actual[i] === column);
}

export function parseCsv(text: string): string[][] {
  const head = text.split(/\r?\n/, HEADER_SEARCH_ROWS).join('\n');
  const separator = head.split(';').length > head.split(',').length ? ';' : ',';
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

function parseOfx(text: string): ImportRow[] {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>|$)/gi) ?? [];
  if (blocks.length === 0) throw new StatementError('O arquivo OFX não tem transações.');

  return blocks.map((block, index) => {
    const tag = (name: string) =>
      new RegExp(`<${name}>([^<\\r\\n]*)`, 'i').exec(block)?.[1].trim() ?? '';
    const posted = tag('DTPOSTED');
    const isoDay = toDay(Number(posted.slice(0, 4)), Number(posted.slice(4, 6)), Number(posted.slice(6, 8)));
    if (!isoDay) throw new StatementError(`Transação ${index + 1} com data inválida: "${posted}"`);
    const cents = parseSignedAmountToCents(tag('TRNAMT'));
    if (!cents) throw new StatementError(`Transação ${index + 1} com valor inválido: "${tag('TRNAMT')}"`);
    const description = tag('MEMO') || tag('NAME');
    return {
      key: `${tag('FITID') || 'ofx'}-${index}`,
      date: isoDay,
      description,
      amountCents: Math.abs(cents),
      type: cents < 0 ? 'EXPENSE' : 'INCOME',
    };
  });
}
