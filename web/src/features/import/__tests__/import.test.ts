import type { CategoryDto } from '@/features/categories/types';
import type { TransactionDto } from '@/features/transactions/types';
import { suggestCategory } from '../categorize';
import { findDuplicates } from '../duplicates';
import { parseCsv, parseStatement, StatementError } from '../parsers';

describe('parseCsv', () => {
  it('handles quoted fields, escaped quotes and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });

  it('detects semicolon separators and drops blank lines', () => {
    expect(parseCsv('a;b\n\n1;2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });
});

describe('parseStatement', () => {
  it('reads the Nubank card bill CSV', () => {
    const { source, rows } = parseStatement(
      'date,title,amount\n2026-10-03,iFood *Restaurante,45.90\n2026-10-05,Pagamento recebido,-1200.00\n2026-10-06,Estorno de compra,-30.00\n'
    );
    expect(source).toBe('nubank-card');
    expect(rows).toEqual([
      { key: 'card-0', date: '2026-10-03', description: 'iFood *Restaurante', amountCents: 4590, type: 'EXPENSE', skipReason: undefined },
      { key: 'card-1', date: '2026-10-05', description: 'Pagamento recebido', amountCents: 120000, type: 'INCOME', skipReason: 'Pagamento da fatura' },
      { key: 'card-2', date: '2026-10-06', description: 'Estorno de compra', amountCents: 3000, type: 'INCOME', skipReason: undefined },
    ]);
  });

  it('reads the Nubank account statement CSV', () => {
    const { source, rows } = parseStatement(
      'Data,Valor,Identificador,Descrição\n05/10/2026,6500.00,abc-1,Transferência recebida - Empresa\n06/10/2026,-89.90,abc-2,"Compra no débito - Mercado, Centro"\n'
    );
    expect(source).toBe('nubank-account');
    expect(rows).toEqual([
      { key: 'abc-1-0', date: '2026-10-05', description: 'Transferência recebida - Empresa', amountCents: 650000, type: 'INCOME', skipReason: undefined },
      { key: 'abc-2-1', date: '2026-10-06', description: 'Compra no débito - Mercado, Centro', amountCents: 8990, type: 'EXPENSE', skipReason: undefined },
    ]);
  });

  it('reads OFX 1.x without closing tags', () => {
    const ofx = [
      'OFXHEADER:100',
      'CHARSET:1252',
      '<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>',
      '<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20261007120000[-3:BRT]<TRNAMT>-125.00<FITID>f1<MEMO>Posto Shell',
      '<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20261008<TRNAMT>50.5<FITID>f2<NAME>Pix recebido',
      '</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>',
    ].join('\n');
    expect(parseStatement(ofx)).toEqual({
      source: 'ofx',
      rows: [
        { key: 'f1-0', date: '2026-10-07', description: 'Posto Shell', amountCents: 12500, type: 'EXPENSE', skipReason: undefined },
        { key: 'f2-1', date: '2026-10-08', description: 'Pix recebido', amountCents: 5050, type: 'INCOME', skipReason: undefined },
      ],
    });
  });

  it('keeps every row of a Pix paid with the credit card, which share one Identificador', () => {
    const { rows } = parseStatement(
      'Data,Valor,Identificador,Descrição\n' +
        '07/01/2026,500.00,same-id,Valor adicionado na conta por cartão de crédito - Valor adicionado para Pix no crédito\n' +
        '07/01/2026,-500.00,same-id,Transferência enviada pelo Pix - Ana Carolina\n'
    );

    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
    // The credit is the card paying for the Pix, not income: it starts unchecked.
    expect(rows[0].skipReason).toBe('Crédito do cartão usado no Pix (não é renda)');
    expect(rows[1].skipReason).toBeUndefined();
  });

  it('leaves moves between own accounts and investments unchecked', () => {
    const { rows } = parseStatement(
      'Data,Valor,Identificador,Descrição\n' +
        '10/01/2026,300.00,a,Resgate RDB\n' +
        '11/01/2026,-300.00,b,Aplicação RDB\n' +
        '12/01/2026,120.00,c,Transferência de saldo NuInvest\n' +
        '13/01/2026,-900.00,d,Pagamento de fatura\n'
    );

    expect(rows.every((r) => r.skipReason)).toBe(true);
  });

  it('rejects unknown formats and bad lines with a readable message', () => {
    expect(() => parseStatement('foo,bar\n1,2')).toThrow(StatementError);
    expect(() => parseStatement('date,title,amount\n2026-13-40,X,1.00')).toThrow('Linha 2 inválida');
  });
});

const category = (id: string, name: string, type: 'INCOME' | 'EXPENSE'): CategoryDto => ({
  id,
  name,
  type,
  color: '#000',
});
const CATEGORIES = [
  category('food', 'Alimentação', 'EXPENSE'),
  category('car', 'Transporte', 'EXPENSE'),
  category('other', 'Outros', 'EXPENSE'),
  category('salary', 'Salário', 'INCOME'),
];

describe('suggestCategory', () => {
  it('matches keywords regardless of case and accents', () => {
    expect(suggestCategory('IFOOD *Restaurante', 'EXPENSE', CATEGORIES)).toBe('food');
    expect(suggestCategory('Uber *Trip', 'EXPENSE', CATEGORIES)).toBe('car');
    expect(suggestCategory('Pagamento de SALÁRIO', 'INCOME', CATEGORIES)).toBe('salary');
  });

  it('falls back to "Outros", then to the first category of the type', () => {
    expect(suggestCategory('Loja qualquer', 'EXPENSE', CATEGORIES)).toBe('other');
    expect(suggestCategory('Pix recebido', 'INCOME', CATEGORIES)).toBe('salary');
  });

  it('skips rules whose category the user deleted', () => {
    const withoutFood = CATEGORIES.filter((c) => c.id !== 'food');
    expect(suggestCategory('iFood', 'EXPENSE', withoutFood)).toBe('other');
  });
});

describe('findDuplicates', () => {
  it('flags rows already in the app by day, type, amount and description', () => {
    const existing = [
      { date: new Date(2026, 9, 3, 12).toISOString(), type: 'EXPENSE', amountCents: 4590, description: 'IFOOD *Restaurante' },
    ] as TransactionDto[];
    const rows = [
      { key: 'a', date: '2026-10-03', description: 'iFood *Restaurante', amountCents: 4590, type: 'EXPENSE' as const },
      { key: 'b', date: '2026-10-04', description: 'iFood *Restaurante', amountCents: 4590, type: 'EXPENSE' as const },
    ];
    expect([...findDuplicates(rows, existing)]).toEqual(['a']);
  });
});
