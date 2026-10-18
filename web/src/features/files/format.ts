import type { IconName } from '@/components/xp';
import { palette } from '@/theme';

export const folderWindowId = (folderId: string) => `folder:${folderId}`;
export const TRASH_WINDOW_ID = 'trash';

export function nextFolderName(existing: string[], base = 'Nova pasta'): string {
  const taken = new Set(existing.map((name) => name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base} (${n})`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${units[unit]}`;
}

const ICONS: { pattern: RegExp; icon: IconName; color: string }[] = [
  { pattern: /\.pdf$/i, icon: 'file-pdf-o', color: '#C62828' },
  { pattern: /\.(png|jpe?g|gif|bmp|webp|svg)$/i, icon: 'file-image-o', color: '#6A1B9A' },
  { pattern: /\.(csv|xlsx?|ods|ofx)$/i, icon: 'file-excel-o', color: '#2E7D32' },
  { pattern: /\.(docx?|odt|rtf)$/i, icon: 'file-word-o', color: palette.navy },
  { pattern: /\.(zip|rar|7z|tar|gz)$/i, icon: 'file-archive-o', color: '#8D6E63' },
  { pattern: /\.(txt|md|log|json|xml)$/i, icon: 'file-text-o', color: '#455A64' },
];

export function fileIcon(name: string): { icon: IconName; color: string } {
  return ICONS.find((entry) => entry.pattern.test(name)) ?? { icon: 'file-o', color: '#607D8B' };
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
