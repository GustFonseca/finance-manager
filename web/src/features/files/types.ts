export type FolderDto = {
  id: string;
  name: string;
  isSystem: boolean;
  fileCount: number;
  createdAt: string;
};

export type StoredFileDto = {
  id: string;
  folderId: string;
  folderName: string | null;
  name: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
  deletedAt: string | null;
};

export type TrashFolderDto = {
  id: string;
  name: string;
  fileCount: number;
  deletedAt: string | null;
};

export type TrashDto = {
  folders: TrashFolderDto[];
  files: StoredFileDto[];
};

export type UpdateFileInput = {
  name?: string;
  folderId?: string;
};
