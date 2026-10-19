import type { TransactionDto } from '@/features/transactions/types';
import { findDuplicates } from '../duplicates';
import { decodeStatement, parseCsv, parseStatement } from '../parsers';
import { ImportRow } from '../types';
import { bufferOf, installTextCodec } from './textCodec';

installTextCodec();

const brief = (rows: ImportRow[]) => rows.map(({ date, description, amountCents, type }) => [date, description, amountCents, type]);

describe('statement encodings', () => {
  it('falls back to windows-1252 when the file is not valid UTF-8', () => {
    const text = 'Data;Descrição;Valor\n19/10/2026;PADARIA SÃO JOÃO;-12,50\n';
    const { rows } = parseStatement(decodeStatement(bufferOf(text, 'latin1')));
    expect(brief(rows)).toEqual([['2026-10-19', 'PADARIA SÃO JOÃO', 1250, 'EXPENSE']]);
  });

  it('decodes OFX files that declare ISO-8859-1', () => {
    const text = 'OFXHEADER:100\nCHARSET:ISO-8859-1\n<OFX><STMTTRN><TRNAMT>-5.00<DTPOSTED>20261019<MEMO>AÇOUGUE<FITID>1</STMTTRN>';
    const { rows } = parseStatement(decodeStatement(bufferOf(text, 'latin1')));
    expect(brief(rows)).toEqual([['2026-10-19', 'AÇOUGUE', 500, 'EXPENSE']]);
  });

  it('keeps reading UTF-8 files with a byte order mark', () => {
    const text = '﻿Data,Valor,Identificador,Descrição\n19/10/2026,-10.00,abc,Compra X\n';
    expect(parseStatement(decodeStatement(bufferOf(text))).source).toBe('nubank-account');
  });
});

describe('separators', () => {
  it('decides the separator from the header row, ignoring a preamble full of commas', () => {
    const text =
      'Extrato de conta, agência 1234, conta 5678, período 01/10 a 19/10, cliente GUSTAVO, emitido em 19/10/2026, 10:00\n\n' +
      'Data;Descrição;Valor\n19/10/2026;PADARIA, PAO E CIA;-5,00\n';
    expect(brief(parseStatement(text).rows)).toEqual([['2026-10-19', 'PADARIA, PAO E CIA', 500, 'EXPENSE']]);
  });

  it('reads tab separated files', () => {
    expect(brief(parseStatement('Data\tDescrição\tValor\n19/10/2026\tPADARIA\t-5,00\n').rows)).toEqual([
      ['2026-10-19', 'PADARIA', 500, 'EXPENSE'],
    ]);
  });

  it('falls back to the most frequent separator when no header is recognised', () => {
    expect(parseCsv('a\tb\tc\n1\t2\t3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });
});

describe('bank CSV layouts', () => {
  it('reads separate credit and debit columns', () => {
    const text =
      'Data;Histórico;Docto.;Crédito (R$);Débito (R$);Saldo (R$)\n' +
      '19/10/2026;PIX ENVIADO;123;;-50,00;100,00\n' +
      '20/10/2026;PIX RECEBIDO;124;80,00;;180,00\n' +
      '21/10/2026;TARIFA;125;;12,90;167,10\n';
    expect(brief(parseStatement(text).rows)).toEqual([
      ['2026-10-19', 'PIX ENVIADO', 5000, 'EXPENSE'],
      ['2026-10-20', 'PIX RECEBIDO', 8000, 'INCOME'],
      ['2026-10-21', 'TARIFA', 1290, 'EXPENSE'],
    ]);
  });

  it('skips balance and total lines', () => {
    const itau =
      'data;lançamento;ag./origem;valor (R$);saldos (R$)\n' +
      '18/10/2026;SALDO ANTERIOR;;;1.000,00\n' +
      '19/10/2026;PIX TRANSF JOAO;;-50,00;\n' +
      '19/10/2026;SALDO DO DIA;;;950,00\n';
    expect(brief(parseStatement(itau).rows)).toEqual([['2026-10-19', 'PIX TRANSF JOAO', 5000, 'EXPENSE']]);

    const withBalance = 'Data;Descrição;Valor\n18/10/2026;SALDO ANTERIOR;1.000,00\n19/10/2026;PADARIA;-5,00\n;Total;-5,00\n';
    expect(brief(parseStatement(withBalance).rows)).toEqual([['2026-10-19', 'PADARIA', 500, 'EXPENSE']]);
  });

  it('keeps the payee when the file has both Histórico and Descrição', () => {
    const text = 'Data Lançamento;Histórico;Descrição;Valor;Saldo\n19/10/2026;Pix enviado;MARIA MORAIS;-50,00;10,00\n20/10/2026;;Tarifa;-1,00;9,00\n';
    expect(brief(parseStatement(text).rows)).toEqual([
      ['2026-10-19', 'Pix enviado - MARIA MORAIS', 5000, 'EXPENSE'],
      ['2026-10-20', 'Tarifa', 100, 'EXPENSE'],
    ]);
  });

  it('reads C6 card bills by the amount in reais, as expenses', () => {
    const text =
      'Data de Compra;Nome no Cartão;Final do Cartão;Categoria;Descrição;Parcela;Valor (em US$);Cotação (em R$);Valor (em R$)\n' +
      '19/10/2026;GUSTAVO;1234;Restaurante;PADARIA REAL;Única;0;0;25,90\n' +
      '20/10/2026;GUSTAVO;1234;Serviços;NETFLIX;Única;0;0;55,90\n' +
      '21/10/2026;GUSTAVO;1234;;Estorno;Única;0;0;-10,00\n';
    expect(brief(parseStatement(text).rows)).toEqual([
      ['2026-10-19', 'PADARIA REAL', 2590, 'EXPENSE'],
      ['2026-10-20', 'NETFLIX', 5590, 'EXPENSE'],
      ['2026-10-21', 'Estorno', 1000, 'INCOME'],
    ]);
  });

  it('reads Inter card bills, whose positive amounts are purchases', () => {
    const text = 'Data;Lançamento;Categoria;Tipo;Valor\n19/10/2026;PADARIA REAL;RESTAURANTES;Compra à vista;R$ 25,90\n';
    expect(brief(parseStatement(text).rows)).toEqual([['2026-10-19', 'PADARIA REAL', 2590, 'EXPENSE']]);
  });

  it('keeps account statements with a Tipo column as they are', () => {
    const text = 'Data;Descrição;Tipo;Valor\n19/10/2026;SALARIO;Crédito;3.000,00\n';
    expect(brief(parseStatement(text).rows)).toEqual([['2026-10-19', 'SALARIO', 300000, 'INCOME']]);
  });

  it('reads yyyy/mm/dd dates and D/C suffixes', () => {
    expect(brief(parseStatement('Data;Descrição;Valor\n2026/10/19;PADARIA;5,00 D\n2026.10.20;ESTORNO;5,00 C\n').rows)).toEqual([
      ['2026-10-19', 'PADARIA', 500, 'EXPENSE'],
      ['2026-10-20', 'ESTORNO', 500, 'INCOME'],
    ]);
  });
});

describe('OFX text', () => {
  it('joins NAME and MEMO when they differ', () => {
    const rows = parseStatement(
      '<OFX><STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261019100000[-3:BRT]<TRNAMT>-5.00<FITID>1<NAME>PADARIA REAL<MEMO>COMPRA CARTAO</STMTTRN>' +
        '<STMTTRN><DTPOSTED>20261019<TRNAMT>-1.00<NAME>UBER<MEMO>UBER TRIP</STMTTRN>' +
        '<STMTTRN><DTPOSTED>20261019<TRNAMT>-2.00<NAME>MERCADO CENTRAL LTDA<MEMO>MERCADO</STMTTRN>' +
        '<STMTTRN><DTPOSTED>20261019<TRNAMT>-3.00<NAME>SO O NOME</STMTTRN>'
    ).rows;
    expect(rows.map((row) => row.description)).toEqual([
      'PADARIA REAL - COMPRA CARTAO',
      'UBER TRIP',
      'MERCADO CENTRAL LTDA',
      'SO O NOME',
    ]);
  });

  it('decodes HTML entities', () => {
    const rows = parseStatement(
      '<OFX><STMTTRN><DTPOSTED>20261019<TRNAMT>-5.00<MEMO>C&amp;A MODAS &#39;X&#x27; &lt;1&gt; &quot;Y&quot; &copy;</STMTTRN>'
    ).rows;
    expect(rows[0].description).toBe('C&A MODAS \'X\' <1> "Y" &copy;');
  });
});

describe('findDuplicates counting', () => {
  it('flags only as many rows as there are matching transactions', () => {
    const rows: ImportRow[] = [
      { key: 'a', date: '2026-10-19', description: 'Cafe', amountCents: 500, type: 'EXPENSE' },
      { key: 'b', date: '2026-10-19', description: 'Cafe', amountCents: 500, type: 'EXPENSE' },
    ];
    const existing = [
      { date: new Date(2026, 9, 19, 12).toISOString(), description: 'Cafe', amountCents: 500, type: 'EXPENSE' },
    ] as TransactionDto[];
    expect([...findDuplicates(rows, existing)]).toEqual(['a']);
    expect([...findDuplicates(rows, [...existing, ...existing])]).toEqual(['a', 'b']);
  });
});

describe('short and empty lines', () => {
  it('tolerates lines missing trailing columns', () => {
    const split = 'Data;Histórico;Crédito;Débito\n19/10/2026;PIX;;\n19/10/2026;TARIFA;;0,00\n20/10/2026;CURTA\n';
    expect(parseStatement(split).rows).toEqual([]);
    const detailed = 'Data;Histórico;Descrição;Tipo;Valor\n19/10/2026\n20/10/2026;;Tarifa;Debito;-1,00\n';
    expect(brief(parseStatement(detailed).rows)).toEqual([['2026-10-20', 'Tarifa', 100, 'EXPENSE']]);
    const trailingDetail = 'Data;Valor;Descrição;Histórico\n19/10/2026;-1,00;Tarifa\n';
    expect(brief(parseStatement(trailingDetail).rows)).toEqual([['2026-10-19', 'Tarifa', 100, 'EXPENSE']]);
  });

  it('honours a declared windows-1252 charset even when the bytes look like UTF-8', () => {
    const text = 'OFXHEADER:100\nCHARSET:1252\n<MEMO>Ã§';
    expect(decodeStatement(bufferOf(text, 'latin1'))).toBe(text);
  });
});
