import { fileIcon, formatBytes, nextFolderName } from '../format';

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
