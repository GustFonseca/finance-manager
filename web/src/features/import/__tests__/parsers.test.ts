import { decodeStatement, parseStatement, StatementError } from '../parsers';
import { dayToIso, isoToDay, toDay } from '../text';
import { SOURCE_LABELS } from '../types';
import { bufferOf, installTextCodec } from './textCodec';

installTextCodec();

describe('decodeStatement', () => {
  it('decodes UTF-8 and drops the byte order mark', () => {
    expect(decodeStatement(bufferOf('﻿Data,Descrição'))).toBe('Data,Descrição');
  });

  it('decodes windows-1252 OFX files', () => {
    const text = 'OFXHEADER:100\nCHARSET:1252\n<MEMO>Padaria São João';
    expect(decodeStatement(bufferOf(text, 'latin1'))).toBe(text);
  });
});

describe('parseStatement edge cases', () => {
  it('rejects an empty file', () => {
    expect(() => parseStatement('')).toThrow(StatementError);
  });

  it('rejects card lines with a zero or invalid amount', () => {
    expect(() => parseStatement('date,title,amount\n2026-10-03,X,0')).toThrow('Linha 2 inválida: valor "0"');
    expect(() => parseStatement('date,title,amount\n2026-10-03,X')).toThrow('Linha 2 inválida: valor "undefined"');
  });

  it('defaults missing card titles and account identifiers', () => {
    expect(parseStatement('date,title,amount\n2026-10-03,,10.00').rows[0].description).toBe('');
    const { rows } = parseStatement('Data,Valor,Identificador,Descrição\n05/10/2026,10.00,,');
    expect(rows[0]).toEqual({ key: 'account-0', date: '2026-10-05', description: '', amountCents: 1000, type: 'INCOME' });
    const short = parseStatement('Data,Valor,Identificador,Descrição\n05/10/2026,-10.00,id-9');
    expect(short.rows[0]).toEqual({ key: 'id-9-0', date: '2026-10-05', description: '', amountCents: 1000, type: 'EXPENSE' });
  });

  it('rejects account lines with an invalid date', () => {
    expect(() => parseStatement('Data,Valor,Identificador,Descrição\n31/02/2026,10.00,x,y')).toThrow(
      'Linha 2 inválida: data "31/02/2026"'
    );
    expect(() => parseStatement('Data,Valor,Identificador,Descrição\n,10.00,x,y')).toThrow('Linha 2 inválida: data ""');
  });

  it('rejects card lines without a date', () => {
    expect(() => parseStatement('date,title,amount\n,X,1.00')).toThrow('Linha 2 inválida: data ""');
  });

  it('rejects OFX files without transactions or with bad values', () => {
    expect(() => parseStatement('<OFX><BANKTRANLIST></BANKTRANLIST></OFX>')).toThrow('O arquivo OFX não tem transações.');
    expect(() => parseStatement('<OFX><STMTTRN><DTPOSTED>2026<TRNAMT>1</STMTTRN></OFX>')).toThrow(
      'Transação 1 com data inválida: "2026"'
    );
    expect(() => parseStatement('<OFX><STMTTRN><DTPOSTED>20261001<TRNAMT>abc</STMTTRN></OFX>')).toThrow(
      'Transação 1 com valor inválido: "abc"'
    );
  });

  it('reads OFX transactions without FITID or MEMO', () => {
    const { rows } = parseStatement('<OFX><STMTTRN><DTPOSTED>20261001<TRNAMT>-5.00</STMTTRN></OFX>');
    expect(rows).toEqual([{ key: 'ofx-0', date: '2026-10-01', description: '', amountCents: 500, type: 'EXPENSE' }]);
  });
});

describe('text helpers', () => {
  it('validates calendar days', () => {
    expect(toDay(2026, 2, 29)).toBeNull();
    expect(toDay(2024, 2, 29)).toBe('2024-02-29');
  });

  it('converts days to noon ISO timestamps and back', () => {
    const iso = dayToIso('2026-10-03');
    expect(new Date(iso).getHours()).toBe(12);
    expect(isoToDay(iso)).toBe('2026-10-03');
  });

  it('falls back to the raw prefix of an unparseable timestamp', () => {
    expect(isoToDay('not-a-date')).toBe('not-a-date');
  });

  it('labels every source', () => {
    expect(Object.keys(SOURCE_LABELS)).toEqual(['nubank-card', 'nubank-account', 'ofx', 'generic-csv']);
  });
});

describe('more statement formats', () => {
  it('reads XML OFX files with closing tags', () => {
    const ofx = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<?OFX OFXHEADER="200" VERSION="220"?>',
      '<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>',
      '<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20261003</DTPOSTED><TRNAMT>-45.90</TRNAMT><FITID>x1</FITID><NAME>iFood</NAME></STMTTRN>',
      '<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20261005100000</DTPOSTED><TRNAMT>1500.00</TRNAMT><MEMO>Salário</MEMO></STMTTRN>',
      '</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>',
    ].join('\n');
    expect(parseStatement(ofx)).toEqual({
      source: 'ofx',
      rows: [
        { key: 'x1-0', date: '2026-10-03', description: 'iFood', amountCents: 4590, type: 'EXPENSE' },
        { key: 'ofx-1', date: '2026-10-05', description: 'Salário', amountCents: 150000, type: 'INCOME' },
      ],
    });
  });

  it('detects OFX by its header or transactions even without the OFX tag', () => {
    expect(parseStatement('OFXHEADER:100\n<STMTTRN><DTPOSTED>20261001<TRNAMT>-1.00').source).toBe('ofx');
    expect(parseStatement('<STMTTRN><DTPOSTED>20261001<TRNAMT>2,50').rows[0].amountCents).toBe(250);
  });

  it('reads Nubank card bills whatever the column order, positive amounts being expenses', () => {
    const { source, rows } = parseStatement('date,category,title,amount\n2026-10-03,restaurante,iFood,45.90\n2026-10-04,,Pagamento recebido,-100.00');
    expect(source).toBe('nubank-card');
    expect(rows).toEqual([
      { key: 'card-0', date: '2026-10-03', description: 'iFood', amountCents: 4590, type: 'EXPENSE' },
      { key: 'card-1', date: '2026-10-04', description: 'Pagamento recebido', amountCents: 10000, type: 'INCOME' },
    ]);
  });

  it('handles card lines missing the reordered columns', () => {
    expect(parseStatement('date,amount,title\n2026-10-03,10.00').rows[0].description).toBe('');
    expect(() => parseStatement('title,amount,date\nX,1.00')).toThrow('Linha 2 inválida: data "undefined"');
  });

  it('reads a generic semicolon CSV in pt-BR format by its header names', () => {
    const text = [
      'Extrato da conta corrente',
      'Agência 0001;Conta 12345',
      'Data Lançamento;Histórico;Valor (R$);Saldo',
      '03/10/2026;Compra Mercado;-1.234,56;10,00',
      '04/10/26;Pix recebido;R$ 2.000,00;',
      ';;;',
      '05.10.2026;Saldo do dia;0,00;100,00',
      '2026-10-06 10:00;Tarifa;-12,9;',
      '07-10-2026 08:30;Estorno;5;',
    ].join('\n');
    expect(parseStatement(text)).toEqual({
      source: 'generic-csv',
      rows: [
        { key: 'csv-0', date: '2026-10-03', description: 'Compra Mercado', amountCents: 123456, type: 'EXPENSE' },
        { key: 'csv-1', date: '2026-10-04', description: 'Pix recebido', amountCents: 200000, type: 'INCOME' },
        { key: 'csv-3', date: '2026-10-06', description: 'Tarifa', amountCents: 1290, type: 'EXPENSE' },
        { key: 'csv-4', date: '2026-10-07', description: 'Estorno', amountCents: 500, type: 'INCOME' },
      ],
    });
  });

  it('reads a generic comma CSV with English headers', () => {
    const { source, rows } = parseStatement('Date,Description,Amount\n2026-10-03,"Coffee, large",-7.50\n,Nota sem data nem valor,');
    expect(source).toBe('generic-csv');
    expect(rows).toEqual([{ key: 'csv-0', date: '2026-10-03', description: 'Coffee, large', amountCents: 750, type: 'EXPENSE' }]);
  });

  it('defaults a missing generic description', () => {
    const { rows } = parseStatement('Valor;Data;Descrição\n10,00;03/10/2026');
    expect(rows).toEqual([{ key: 'csv-0', date: '2026-10-03', description: '', amountCents: 1000, type: 'INCOME' }]);
  });

  it('rejects generic lines with an invalid date or amount pointing to the file line', () => {
    expect(() => parseStatement('x\nData;Descrição;Valor\n31/02/2026;A;1,00')).toThrow('Linha 3 inválida: data "31/02/2026"');
    expect(() => parseStatement('Data;Descrição;Valor\nontem;A;1,00')).toThrow('Linha 2 inválida: data "ontem"');
    expect(() => parseStatement('Data;Descrição;Valor\n03/10/2026;A;abc')).toThrow('Linha 2 inválida: valor "abc"');
  });

  it('skips lines without a date or an amount', () => {
    expect(parseStatement('Data;Descrição;Valor\n03/10/2026;A').rows).toEqual([]);
    expect(parseStatement('Valor;Descrição;Data\n1,00').rows).toEqual([]);
  });

  it('only looks for the header in the first lines', () => {
    const preamble = Array.from({ length: 10 }, (_, i) => `linha ${i}`).join('\n');
    expect(() => parseStatement(`${preamble}\nData;Descrição;Valor\n03/10/2026;A;1,00`)).toThrow('Formato não reconhecido');
  });
});
