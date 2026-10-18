import React, { useEffect } from 'react';
import { useWindowManager } from '@/components/xp';
import { FolderDto, StoredFileDto } from '../types';

export function OpenWindow({ id, children }: { id: string; children: React.ReactNode }) {
  const wm = useWindowManager();
  useEffect(() => wm.open(id), [id]);
  return <>{children}</>;
}

export function folder(overrides: Partial<FolderDto> = {}): FolderDto {
  return { id: 'd1', name: 'Documentos', isSystem: false, fileCount: 0, createdAt: '2026-10-01T10:00:00Z', ...overrides };
}

export function storedFile(overrides: Partial<StoredFileDto> = {}): StoredFileDto {
  return {
    id: 'f1',
    folderId: 'd1',
    folderName: 'Documentos',
    name: 'extrato.pdf',
    contentType: 'application/pdf',
    sizeBytes: 2048,
    createdAt: '2026-10-02T13:30:00Z',
    deletedAt: null,
    ...overrides,
  };
}

export function fakeLocation() {
  const original = window.location;
  const fake = { origin: 'http://localhost', href: '', hash: '', pathname: '/' };
  delete (window as { location?: Location }).location;
  (window as unknown as { location: typeof fake }).location = fake;
  return {
    fake,
    restore: () => {
      (window as unknown as { location: Location }).location = original;
    },
  };
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
