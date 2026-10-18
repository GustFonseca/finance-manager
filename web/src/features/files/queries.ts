import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { filesApi, foldersApi, trashApi } from './api';
import { UpdateFileInput } from './types';

export function invalidateFiles(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.folders });
  qc.invalidateQueries({ queryKey: queryKeys.files });
  qc.invalidateQueries({ queryKey: queryKeys.trash });
}

export function useFolders() {
  return useQuery({ queryKey: queryKeys.folders, queryFn: foldersApi.getAll });
}

export function useFolderFiles(folderId: string) {
  return useQuery({
    queryKey: [...queryKeys.files, folderId],
    queryFn: () => foldersApi.getFiles(folderId),
  });
}

export function useTrash() {
  return useQuery({ queryKey: queryKeys.trash, queryFn: trashApi.get });
}

function useFilesMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => invalidateFiles(qc) });
}

export const useCreateFolder = () => useFilesMutation((name: string) => foldersApi.create(name));

export const useRenameFolder = () =>
  useFilesMutation((input: { id: string; name: string }) => foldersApi.rename(input.id, input.name));

export const useTrashFolder = () => useFilesMutation((id: string) => foldersApi.trash(id));

export const useUploadFiles = () =>
  useFilesMutation((input: { folderId: string; files: File[] }) =>
    foldersApi.upload(input.folderId, input.files)
  );

export const useUpdateFile = () =>
  useFilesMutation((input: { id: string } & UpdateFileInput) => filesApi.update(input.id, input));

export const useTrashFile = () => useFilesMutation((id: string) => filesApi.trash(id));

export const useEmptyTrash = () => useFilesMutation(() => trashApi.empty());

export const useRestoreFromTrash = () =>
  useFilesMutation((item: { kind: 'folder' | 'file'; id: string }) =>
    item.kind === 'folder' ? trashApi.restoreFolder(item.id) : trashApi.restoreFile(item.id)
  );

export const useDeleteForever = () =>
  useFilesMutation((item: { kind: 'folder' | 'file'; id: string }) =>
    item.kind === 'folder' ? trashApi.deleteFolder(item.id) : trashApi.deleteFile(item.id)
  );
