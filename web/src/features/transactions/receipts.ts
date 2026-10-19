import { foldersApi } from '@/features/files/api';
import { FolderDto } from '@/features/files/types';
import { normalizeText } from '@/lib/text';

export const RECEIPTS_FOLDER = 'Comprovantes';

let receiptsFolder: Promise<FolderDto> | null = null;

async function findOrCreateReceiptsFolder(): Promise<FolderDto> {
  const folders = await foldersApi.getAll();
  return (
    folders.find((f) => normalizeText(f.name) === normalizeText(RECEIPTS_FOLDER)) ??
    (await foldersApi.create(RECEIPTS_FOLDER))
  );
}

function receiptsFolderOnce(): Promise<FolderDto> {
  if (!receiptsFolder) {
    const forget = () => {
      receiptsFolder = null;
    };
    receiptsFolder = findOrCreateReceiptsFolder();
    receiptsFolder.then(forget, forget);
  }
  return receiptsFolder;
}

export async function uploadReceipt(file: File): Promise<string> {
  const folder = await receiptsFolderOnce();
  const [stored] = await foldersApi.upload(folder.id, [file]);
  return stored.id;
}
