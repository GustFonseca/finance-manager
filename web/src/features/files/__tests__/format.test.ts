import { fileIcon, folderWindowId, formatBytes, formatDate, nextFolderName, TRASH_WINDOW_ID } from '../format';

describe('nextFolderName', () => {
  it('uses "Nova pasta" when it is free', () => {
    expect(nextFolderName(['Documentos'])).toBe('Nova pasta');
  });

  it('numbers it like Windows when taken, ignoring case', () => {
    expect(nextFolderName(['nova pasta'])).toBe('Nova pasta (2)');
    expect(nextFolderName(['Nova pasta', 'Nova pasta (2)'])).toBe('Nova pasta (3)');
  });
});

describe('formatBytes', () => {
  it('shows small files in bytes', () => {
    expect(formatBytes(532)).toBe('532 bytes');
  });

  it('switches to KB / MB with a pt-BR decimal comma', () => {
    expect(formatBytes(12800)).toBe('12,5 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3 MB');
  });
});

describe('fileIcon', () => {
  it('picks an icon by extension', () => {
    expect(fileIcon('extrato.PDF').icon).toBe('file-pdf-o');
    expect(fileIcon('Nubank_2026-10.csv').icon).toBe('file-excel-o');
    expect(fileIcon('foto.jpeg').icon).toBe('file-image-o');
  });

  it('falls back to a generic file icon', () => {
    expect(fileIcon('sem-extensao').icon).toBe('file-o');
  });
});

describe('formatBytes for large files', () => {
  it('stops at GB', () => {
    expect(formatBytes(5 * 1024 ** 3)).toBe('5 GB');
    expect(formatBytes(2048 * 1024 ** 3)).toBe('2.048 GB');
  });
});

describe('fileIcon for the other kinds', () => {
  it('recognizes documents, archives and text files', () => {
    expect(fileIcon('contrato.docx').icon).toBe('file-word-o');
    expect(fileIcon('backup.zip').icon).toBe('file-archive-o');
    expect(fileIcon('notas.txt').icon).toBe('file-text-o');
  });
});

describe('window ids and dates', () => {
  it('builds folder window ids and exposes the trash id', () => {
    expect(folderWindowId('abc')).toBe('folder:abc');
    expect(TRASH_WINDOW_ID).toBe('trash');
  });

  it('formats dates in pt-BR with date and time', () => {
    const iso = '2026-10-02T13:30:00Z';
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
  });
});
