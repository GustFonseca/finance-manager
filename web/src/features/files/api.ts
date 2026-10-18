import { http } from '@/lib/http';
import { FolderDto, StoredFileDto, TrashDto, UpdateFileInput } from './types';

export const foldersApi = {
  getAll: () => http.get<FolderDto[]>('/folders').then((r) => r.data),
  create: (name: string) => http.post<FolderDto>('/folders', { name }).then((r) => r.data),
  rename: (id: string, name: string) =>
    http.put<FolderDto>(`/folders/${id}`, { name }).then((r) => r.data),
  trash: (id: string) => http.delete(`/folders/${id}`).then(() => undefined),
  getFiles: (id: string) => http.get<StoredFileDto[]>(`/folders/${id}/files`).then((r) => r.data),
  upload: (id: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return http
      .post<StoredFileDto[]>(`/folders/${id}/files`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};

export const filesApi = {
  update: (id: string, input: UpdateFileInput) =>
    http.put<StoredFileDto>(`/files/${id}`, input).then((r) => r.data),
  trash: (id: string) => http.delete(`/files/${id}`).then(() => undefined),
  downloadUrl: (id: string) =>
    http.get<{ url: string }>(`/files/${id}/download`).then((r) => r.data.url),
};

export const trashApi = {
  get: () => http.get<TrashDto>('/trash').then((r) => r.data),
  empty: () => http.delete('/trash').then(() => undefined),
  restoreFolder: (id: string) => http.post(`/trash/folders/${id}/restore`).then(() => undefined),
  restoreFile: (id: string) => http.post(`/trash/files/${id}/restore`).then(() => undefined),
  deleteFolder: (id: string) => http.delete(`/trash/folders/${id}`).then(() => undefined),
  deleteFile: (id: string) => http.delete(`/trash/files/${id}`).then(() => undefined),
};
