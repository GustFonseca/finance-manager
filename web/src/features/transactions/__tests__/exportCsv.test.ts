import { dayToIso } from '@/lib/periods';
import { buildTransactionsCsv, downloadCsv, REVOKE_AFTER_MS } from '../exportCsv';
import { TransactionDto } from '../types';

const base: TransactionDto = {
  id: 't1',
  accountId: 'a1',
  accountName: 'Nubank',
  categoryId: 'c1',
  categoryName: 'Alimentação',
  type: 'EXPENSE',
  amountCents: 4590,
  description: 'iFood *Restaurante',
  date: dayToIso('2026-10-03'),
  recurrence: 'NONE',
  merchantId: 'm1',
  merchantName: 'iFood',
  receiptFileId: null,
};

describe('buildTransactionsCsv', () => {
  it('writes a BOM, the header and one semicolon separated line per transaction', () => {
    const csv = buildTransactionsCsv([
      base,
      { ...base, id: 't2', type: 'INCOME', amountCents: 650000, description: 'Salário', merchantName: '', date: dayToIso('2026-10-05') },
    ]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Data;Descrição;Estabelecimento;Categoria;Conta;Tipo;Valor',
      '03/10/2026;iFood *Restaurante;iFood;Alimentação;Nubank;Despesa;-45,90',
      '05/10/2026;Salário;;Alimentação;Nubank;Receita;6500,00',
    ]);
  });

  it('quotes fields with separators, quotes or line breaks', () => {
    const csv = buildTransactionsCsv([
      { ...base, description: 'Pedido; mesa 2', merchantName: 'Bar "Zé"', categoryName: 'Linha\nnova', accountName: 'C\rD' },
    ]);

    expect(csv.slice(1).split('\r\n')[1]).toBe(
      '03/10/2026;"Pedido; mesa 2";"Bar ""Zé""";"Linha\nnova";"C\rD";Despesa;-45,90'
    );
  });

  it('writes only the header when there are no transactions', () => {
    expect(buildTransactionsCsv([])).toBe('﻿Data;Descrição;Estabelecimento;Categoria;Conta;Tipo;Valor');
  });
});

describe('buildTransactionsCsv formula safety', () => {
  it('neutralises text that a spreadsheet would run as a formula, but not the amounts', () => {
    const csv = buildTransactionsCsv([
      {
        id: 'x', accountId: 'a', accountName: '@conta', categoryId: 'c', categoryName: '+Categoria',
        type: 'EXPENSE', amountCents: 1000, description: '=HYPERLINK("http://evil","x")',
        date: '2026-10-03T15:00:00Z', recurrence: 'NONE', merchantId: null, merchantName: '-Loja', receiptFileId: null,
      },
    ]);

    const line = csv.split('\r\n')[1];
    expect(line).toBe(`03/10/2026;"'=HYPERLINK(""http://evil"",""x"")";'-Loja;'+Categoria;'@conta;Despesa;-10,00`);
  });
});

describe('downloadCsv', () => {
  const original = { create: URL.createObjectURL, revoke: URL.revokeObjectURL };

  afterEach(() => {
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
  });

  it('downloads the content through a temporary link', async () => {
    let blob: Blob | undefined;
    URL.createObjectURL = jest.fn((value: Blob) => {
      blob = value;
      return 'blob:csv';
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = jest.fn();
    const clicked: { href: string; download: string; attached: boolean }[] = [];
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push({ href: this.href, download: this.download, attached: document.body.contains(this) });
    });

    jest.useFakeTimers();

    downloadCsv('transacoes-2026-10.csv', 'a;b');

    expect(clicked).toEqual([{ href: 'blob:csv', download: 'transacoes-2026-10.csv', attached: true }]);
    expect(document.querySelector('a')).toBeNull();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    jest.advanceTimersByTime(REVOKE_AFTER_MS);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:csv');
    jest.useRealTimers();
    expect(blob!.type).toBe('text/csv;charset=utf-8');
    expect(blob!.size).toBe(3);
    click.mockRestore();
  });
});
