import { isoToDay } from '@/lib/periods';
import { TransactionDto } from './types';

const HEADER = ['Data', 'Descrição', 'Estabelecimento', 'Categoria', 'Conta', 'Tipo', 'Valor'];

export const REVOKE_AFTER_MS = 1000;

function cell(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function text(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function amount(transaction: TransactionDto): string {
  const signed = transaction.type === 'EXPENSE' ? -transaction.amountCents : transaction.amountCents;
  return (signed / 100).toFixed(2).replace('.', ',');
}

export function buildTransactionsCsv(transactions: TransactionDto[]): string {
  const rows = transactions.map((t) => [
    isoToDay(t.date).split('-').reverse().join('/'),
    text(t.description),
    text(t.merchantName),
    text(t.categoryName),
    text(t.accountName),
    t.type === 'EXPENSE' ? 'Despesa' : 'Receita',
    amount(t),
  ]);
  return '﻿' + [HEADER, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
}

export function downloadCsv(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_AFTER_MS);
}
