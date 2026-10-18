import type { TransactionDto } from '@/features/transactions/types';
import { isoToDay, normalizeText } from './text';
import { ImportRow } from './types';

function fingerprint(day: string, type: string, amountCents: number, description: string) {
  return [day, type, amountCents, normalizeText(description)].join('|');
}

export function findDuplicates(rows: ImportRow[], existing: TransactionDto[]): Set<string> {
  const known = new Set(
    existing.map((t) => fingerprint(isoToDay(t.date), t.type, t.amountCents, t.description))
  );
  return new Set(
    rows
      .filter((row) => known.has(fingerprint(row.date, row.type, row.amountCents, row.description)))
      .map((row) => row.key)
  );
}
