import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/render';
import { filesApi, foldersApi, trashApi } from '../api';
import {
  useCreateFolder,
  useDeleteForever,
  useEmptyTrash,
  useFolderFiles,
  useFolders,
  useRenameFolder,
  useRestoreFromTrash,
  useTrash,
  useTrashFile,
  useTrashFolder,
  useUpdateFile,
  useUploadFiles,
} from '../queries';

jest.mock('../api');

function setup() {
  const client = createTestQueryClient();
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const invalidate = jest.spyOn(client, 'invalidateQueries');
  return { client, wrapper, invalidate };
}

function expectFilesInvalidated(invalidate: jest.SpyInstance) {
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['folders'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['files'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['trash'] });
}

describe('files queries', () => {
  it('loads folders, folder files and the trash', async () => {
    jest.mocked(foldersApi.getAll).mockResolvedValue([{ id: 'd1' }] as never);
    jest.mocked(foldersApi.getFiles).mockResolvedValue([{ id: 'f1' }] as never);
    jest.mocked(trashApi.get).mockResolvedValue({ folders: [], files: [] });
    const { client, wrapper } = setup();

    const folders = renderHook(() => useFolders(), { wrapper });
    const files = renderHook(() => useFolderFiles('d1'), { wrapper });
    const trash = renderHook(() => useTrash(), { wrapper });
    await waitFor(() => expect(folders.result.current.data).toEqual([{ id: 'd1' }]));
    await waitFor(() => expect(files.result.current.data).toEqual([{ id: 'f1' }]));
    await waitFor(() => expect(trash.result.current.data).toEqual({ folders: [], files: [] }));
    expect(foldersApi.getFiles).toHaveBeenCalledWith('d1');
    expect(client.getQueryData(['files', 'd1'])).toEqual([{ id: 'f1' }]);
  });

  it.each([
    ['create folder', () => useCreateFolder(), 'Nova', () => expect(foldersApi.create).toHaveBeenCalledWith('Nova')],
    ['rename folder', () => useRenameFolder(), { id: 'd1', name: 'X' }, () => expect(foldersApi.rename).toHaveBeenCalledWith('d1', 'X')],
    ['trash folder', () => useTrashFolder(), 'd1', () => expect(foldersApi.trash).toHaveBeenCalledWith('d1')],
    ['upload', () => useUploadFiles(), { folderId: 'd1', files: [] }, () => expect(foldersApi.upload).toHaveBeenCalledWith('d1', [])],
    ['update file', () => useUpdateFile(), { id: 'f1', name: 'n' }, () => expect(filesApi.update).toHaveBeenCalledWith('f1', { id: 'f1', name: 'n' })],
    ['trash file', () => useTrashFile(), 'f1', () => expect(filesApi.trash).toHaveBeenCalledWith('f1')],
    ['empty trash', () => useEmptyTrash(), undefined, () => expect(trashApi.empty).toHaveBeenCalled()],
    ['restore folder', () => useRestoreFromTrash(), { kind: 'folder', id: 'd1' }, () => expect(trashApi.restoreFolder).toHaveBeenCalledWith('d1')],
    ['restore file', () => useRestoreFromTrash(), { kind: 'file', id: 'f1' }, () => expect(trashApi.restoreFile).toHaveBeenCalledWith('f1')],
    ['delete folder', () => useDeleteForever(), { kind: 'folder', id: 'd1' }, () => expect(trashApi.deleteFolder).toHaveBeenCalledWith('d1')],
    ['delete file', () => useDeleteForever(), { kind: 'file', id: 'f1' }, () => expect(trashApi.deleteFile).toHaveBeenCalledWith('f1')],
  ] as [string, () => { mutateAsync: (input: unknown) => Promise<unknown> }, unknown, () => void][])(
    '%s calls the api and invalidates folders, files and trash',
    async (_name, useHook, input, check) => {
      const { wrapper, invalidate } = setup();
      const { result } = renderHook(useHook, { wrapper });
      await act(() => result.current.mutateAsync(input));
      check();
      expectFilesInvalidated(invalidate);
    }
  );
});
