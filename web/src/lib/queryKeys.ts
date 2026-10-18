/**
 * Central registry of React Query cache keys. Queries may append parameters
 * (e.g. `[...queryKeys.transactions, { start, end }]`); invalidating with the
 * base key matches every variation.
 */
export const queryKeys = {
  accounts: ['accounts'] as const,
  categories: ['categories'] as const,
  transactions: ['transactions'] as const,
  goals: ['goals'] as const,
  summary: ['summary'] as const,
  folders: ['folders'] as const,
  /** Files of one folder: `[...queryKeys.files, folderId]`. */
  files: ['files'] as const,
  trash: ['trash'] as const,
  activity: ['activity'] as const,
  savings: ['savings'] as const,
  merchants: ['merchants'] as const,
};
