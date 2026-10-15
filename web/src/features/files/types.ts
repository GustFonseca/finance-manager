export type FolderDto = {
  id: string;
  name: string;
  /** The default "Extratos importados" folder: can't be renamed or deleted. */
  isSystem: boolean;
  fileCount: number;
  createdAt: string;
};

export type StoredFileDto = {
  id: string;
  folderId: string;
  /** Only in the trash, where files from several folders are listed together. */
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

/** Rename and/or move; omitted fields stay as they are. */
export type UpdateFileInput = {
  name?: string;
  folderId?: string;
};
