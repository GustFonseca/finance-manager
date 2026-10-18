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
    expect(Object.keys(SOURCE_LABELS)).toEqual(['nubank-card', 'nubank-account', 'ofx']);
  });
});
