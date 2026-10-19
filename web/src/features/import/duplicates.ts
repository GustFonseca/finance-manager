import type { TransactionDto } from '@/features/transactions/types';
import { isoToDay, normalizeText } from './text';
import { ImportRow } from './types';

function fingerprint(day: string, type: string, amountCents: number, description: string) {
  return [day, type, amountCents, normalizeText(description)].join('|');
}

export function findDuplicates(rows: ImportRow[], existing: TransactionDto[]): Set<string> {
  const known = new Map<string, number>();
  for (const t of existing) {
    const print = fingerprint(isoToDay(t.date), t.type, t.amountCents, t.description);
    known.set(print, (known.get(print) ?? 0) + 1);
  }
  const duplicates = new Set<string>();
  for (const row of rows) {
    const print = fingerprint(row.date, row.type, row.amountCents, row.description);
    const left = known.get(print) ?? 0;
    if (left === 0) continue;
    known.set(print, left - 1);
    duplicates.add(row.key);
  }
  return duplicates;
}
