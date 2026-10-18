import { foldersApi } from '@/features/files/api';
import { normalizeText } from '@/lib/text';

export const RECEIPTS_FOLDER = 'Comprovantes';

export async function uploadReceipt(file: File): Promise<string> {
  const folders = await foldersApi.getAll();
  const folder =
    folders.find((f) => normalizeText(f.name) === normalizeText(RECEIPTS_FOLDER)) ??
    (await foldersApi.create(RECEIPTS_FOLDER));
  const [stored] = await foldersApi.upload(folder.id, [file]);
  return stored.id;
}
