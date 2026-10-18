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
  if (/<OFX>/i.test(text)) return { source: 'ofx', rows: parseOfx(text) };

  const [header, ...lines] = parseCsv(text);
  const columns = (header ?? []).map(normalizeText);
  if (sameColumns(columns, ['date', 'title', 'amount'])) {
    return { source: 'nubank-card', rows: lines.map(parseCardLine) };
  }
  if (sameColumns(columns, ['data', 'valor', 'identificador', 'descricao'])) {
    return { source: 'nubank-account', rows: lines.map(parseAccountLine) };
  }
  throw new StatementError(
    'Formato não reconhecido. Use o CSV da fatura ou do extrato exportado pelo app do Nubank, ou um arquivo OFX.'
  );
}

function sameColumns(actual: string[], expected: string[]) {
  return expected.every((column, i) => actual[i] === column);
}

export function parseCsv(text: string): string[][] {
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const separator = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
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
  const [day, month, year] = (date ?? '').split('/').map(Number);
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
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>)/gi) ?? [];
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
